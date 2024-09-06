import assert from 'assert';
import path, { dirname } from 'path';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

import { checkLocalStorageForRestrictedValues, checkChromeStorageForRestrictedValues } from './checkStorage.js';
import { importFromSeed, setPassword } from './importFromSeed.js';
import { verifyPrivateKey, verifyViewKey } from './verifyKeys.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SEED_PHRASE = 'quote achieve sleep lake orange blame milk theory head pill illegal grass';
const PASSWORD = 'Password123!';
const EXPECTED_PRIVATE_KEY = 'APrivateKey1zkpCYJvNsVW8pKJ1SuydhT5PbjrTRL4RRZgpoh9hMnvQQpU';
const EXPECTED_VIEW_KEY = 'AViewKey1dC7zdws8qEsGjqLHQkwH1P4SG7zJYTC83vTnN7NPdjXm';

(async () => {
  const pathToExtension = path.join(path.dirname(__dirname), '..', 'dist/chrome_unpacked');
  console.log(`Using extension: ${pathToExtension}`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`]
  });

  console.log('Launched browser!');
  const fullPageTarget = await browser.waitForTarget((target: { url: () => string | string[] }) =>
    target.url().includes('fullpage.html')
  );
  let fullPage = await fullPageTarget.page();
  console.log('Loaded extension!');
  assert(fullPage, 'Could not get full page');

  // Test importing from seed
  console.log('Testing importing from seed');
  fullPage = await importFromSeed(SEED_PHRASE, fullPage);
  console.log('Successfully imported from seed!');

  // Test setting password
  console.log('Testing setting password');
  fullPage = await setPassword(PASSWORD, fullPage);
  console.log('Successfully set password!');

  // Ensure no leaking of view keys or private keys to local storage
  console.log('Testing local storage');
  fullPage = await checkLocalStorageForRestrictedValues([EXPECTED_PRIVATE_KEY, EXPECTED_VIEW_KEY], fullPage);
  console.log('Successfully checked local storage!');

  console.log('Testing chrome storage');
  fullPage = await checkChromeStorageForRestrictedValues([EXPECTED_PRIVATE_KEY, EXPECTED_VIEW_KEY], fullPage);
  console.log('Successfully checked chrome storage!');

  // Test private key is correct
  console.log('Testing private key');
  fullPage = await verifyPrivateKey(PASSWORD, EXPECTED_PRIVATE_KEY, fullPage);
  console.log('Successfully verified private key!');

  // Test view key is correct
  console.log('Testing view key');
  fullPage = await verifyViewKey(PASSWORD, EXPECTED_VIEW_KEY, fullPage);
  console.log('Successfully verified view key!');

  // Close the browser
  await browser.close();
})();
