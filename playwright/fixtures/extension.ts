import fs from 'fs';
import os from 'os';
import path from 'path';
import { chromium, test as base } from '@playwright/test';
import { execSync } from 'child_process';

type Fixtures = {
  extensionPath: string;
  extensionId: string;
  extensionContext: import('@playwright/test').BrowserContext;
};

const ROOT_DIR = path.resolve(__dirname, '../..');
const DEFAULT_EXTENSION_PATH = path.join(ROOT_DIR, 'dist', 'chrome_unpacked');

function ensureExtensionBuilt(extensionPath: string) {
  const manifestPath = path.join(extensionPath, 'manifest.json');
  if (fs.existsSync(manifestPath) || process.env.SKIP_EXTENSION_BUILD === 'true') {
    return;
  }

  const env = { ...process.env };
  // Skip fork-ts-checker to avoid TypeScript patching issues in CI/Playwright runs.
  env.DISABLE_TS_CHECKER = 'true';
  env.MIDEN_USE_MOCK_CLIENT = env.MIDEN_USE_MOCK_CLIENT || 'true';

  execSync('yarn build:chrome', {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    env,
  });
}

export const test = base.extend<Fixtures>({
  extensionPath: async ({}, use) => {
    const extensionPath = process.env.EXTENSION_DIST ?? DEFAULT_EXTENSION_PATH;
    ensureExtensionBuilt(extensionPath);
    await use(extensionPath);
  },

  extensionContext: async ({ extensionPath }, use) => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'miden-wallet-pw-'));

    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // extensions only run in headed Chromium
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    await use(context);

    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  },

  extensionId: async ({ extensionContext }, use) => {
    const serviceWorker =
      extensionContext.serviceWorkers()[0] ??
      (await extensionContext.waitForEvent('serviceworker'));

    const extensionId = new URL(serviceWorker.url()).host;
    await use(extensionId);
  },
});

export const expect = test.expect;
