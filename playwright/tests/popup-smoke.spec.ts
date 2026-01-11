import { expect, test } from '../fixtures/extension';

const TEST_PASSWORD = 'pw';
const TEST_MNEMONIC = 'test test test test test test test test test test test test';

async function sendWalletMessage(page: any, message: any) {
  try {
    return await page.evaluate(
      (msg: any) =>
        new Promise((resolve, reject) => {
          // @ts-ignore
          chrome.runtime.sendMessage(msg, (response: any) => {
            // @ts-ignore
            const err = chrome.runtime.lastError;
            if (err) {
              reject(new Error(err.message));
              return;
            }
            resolve(response);
          });
        }),
      message
    );
  } catch (err: any) {
    if (String(err.message).includes('The message port closed')) {
      await page.waitForTimeout(500);
      return sendWalletMessage(page, message);
    }
    throw err;
  }
}

async function ensureWalletReady(page: any) {
  for (let i = 0; i < 5; i++) {
    const stateRes: any = await sendWalletMessage(page, { type: 'GET_STATE_REQUEST' });
    const status = stateRes?.state?.status;
    if (status === 'READY') {
      return stateRes.state;
    }
    if (status === 'LOCKED') {
      await sendWalletMessage(page, { type: 'UNLOCK_REQUEST', password: TEST_PASSWORD });
    } else {
      await sendWalletMessage(page, {
        type: 'NEW_WALLET_REQUEST',
        password: TEST_PASSWORD,
        mnemonic: TEST_MNEMONIC,
        ownMnemonic: true
      });
    }
    await page.waitForTimeout(500);
  }
  throw new Error('Wallet not ready after retries');
}

test.describe.configure({ mode: 'serial' });

test.describe('Fullpage UI', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'Extension UI only runs in Chromium');

  test('loads UI without console errors', async ({ extensionContext, extensionId }) => {
    const fullpageUrl = `chrome-extension://${extensionId}/fullpage.html`;
    const errors: string[] = [];

    extensionContext.on('page', page => {
      page.on('console', message => {
        if (message.type() === 'error') {
          errors.push(message.text());
        }
      });
    });

    const page = await extensionContext.newPage();
    await page.goto(fullpageUrl, { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveTitle('Miden Wallet');
    await page.waitForSelector('#root');

    expect(errors).toHaveLength(0);
  });

  test('onboarding create flow completes and shows Explore page', async ({ extensionContext, extensionId }) => {
    const fullpageUrl = `chrome-extension://${extensionId}/fullpage.html`;
    const page = await extensionContext.newPage();

    await page.goto(fullpageUrl, { waitUntil: 'domcontentloaded' });

    const welcome = page.getByTestId('onboarding-welcome');
    await welcome.waitFor({ timeout: 30000 });
    if (page.isClosed()) {
      throw new Error('Page closed before onboarding');
    }
    await welcome.getByRole('button', { name: /create a new wallet/i }).click();

    await page.getByText(/back up your wallet/i).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: /show/i }).click();

    // Extract the 10th word from the seed phrase display
    // The structure is: article > label (Chip) > label > [p (index), p (word)]
    // We get all the word paragraphs (second p in each inner label)
    const seedWords = await page.$$eval('article > label > label > p:last-child', paragraphs =>
      paragraphs.map(p => p.textContent?.trim() || '')
    );
    const tenthWord = seedWords[9];

    if (!tenthWord) {
      throw new Error('Failed to read 10th seed word from backup screen');
    }

    await page.getByRole('button', { name: /continue/i }).click();

    await page.getByTestId('verify-seed-phrase').waitFor({ timeout: 15000 });

    // Select the correct word (10th word) and continue
    const verifyContainer = page.getByTestId('verify-seed-phrase');
    // Click the button containing the word (the word is inside a Chip/label inside a button)
    await verifyContainer.locator(`button:has-text("${tenthWord}")`).first().click();
    await verifyContainer.getByRole('button', { name: /continue/i }).click();

    // Set password
    await expect(page).toHaveURL(/create-password/);
    await page.locator('input[placeholder="Enter password"]').first().fill('Password123!');
    await page.locator('input[placeholder="Enter password again"]').first().fill('Password123!');
    await page.getByRole('button', { name: /continue/i }).click();

    // Complete onboarding and verify we reach the Explore page
    await expect(page.getByText(/your wallet is ready/i)).toBeVisible();
    await page.getByRole('button', { name: /get started/i }).click();
    // Verify Explore page by checking for Send, Receive, Faucet buttons
    await expect(page.getByText('Send')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Receive')).toBeVisible({ timeout: 30000 });
  });

  test('onboarding import flow completes and shows Explore page', async ({ extensionContext, extensionId }) => {
    const fullpageUrl = `chrome-extension://${extensionId}/fullpage.html`;
    const page = await extensionContext.newPage();

    await page.goto(fullpageUrl, { waitUntil: 'domcontentloaded' });

    const welcome = page.getByTestId('onboarding-welcome');
    await welcome.waitFor({ timeout: 30000 });
    if (page.isClosed()) {
      throw new Error('Page closed before onboarding');
    }
    await welcome.getByRole('button', { name: /i already have a wallet/i }).click();

    const importType = page.getByTestId('import-select-type');
    await importType.waitFor({ timeout: 15000 });

    await importType.getByText(/import with seed phrase/i).click();

    const words = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(
      ' '
    );
    for (let i = 0; i < words.length; i++) {
      await page.locator(`#seed-phrase-input-${i}`).fill(words[i]);
    }
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page).toHaveURL(/create-password/);
    await page.locator('input[placeholder="Enter password"]').first().fill('Password123!');
    await page.locator('input[placeholder="Enter password again"]').first().fill('Password123!');
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByText(/your wallet is ready/i)).toBeVisible();

    // Complete onboarding and verify we reach the Explore page
    await page.getByRole('button', { name: /get started/i }).click();
    // Verify Explore page by checking for Send, Receive, Faucet buttons
    await expect(page.getByText('Send')).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('Receive')).toBeVisible({ timeout: 30000 });
  });


  test('import seed phrase enforces valid words before continue', async ({ extensionContext, extensionId }) => {
    const fullpageUrl = `chrome-extension://${extensionId}/fullpage.html`;
    const page = await extensionContext.newPage();

    await page.goto(fullpageUrl, { waitUntil: 'domcontentloaded' });

    const welcome = page.getByTestId('onboarding-welcome');
    await welcome.waitFor({ timeout: 30000 });
    if (page.isClosed()) {
      throw new Error('Page closed before onboarding');
    }
    await welcome.getByRole('button', { name: /i already have a wallet/i }).click();

    const importType = page.getByTestId('import-select-type');
    await importType.waitFor({ timeout: 15000 });
    await importType.getByText(/import with seed phrase/i).click();

    const seedForm = page.getByTestId('import-seed-phrase');
    await seedForm.waitFor({ timeout: 15000 });

    const continueButton = page.getByRole('button', { name: /continue/i });
    await seedForm.locator('#seed-phrase-input-0').fill('notaword');
    await expect(continueButton).toBeDisabled();

    const words = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(
      ' '
    );
    for (let i = 0; i < words.length; i++) {
      await seedForm.locator(`#seed-phrase-input-${i}`).fill(words[i]);
    }

    await expect(continueButton).toBeEnabled();
  });

  test('send flow renders and stays disabled without inputs', async ({ extensionContext, extensionId }) => {
    const fullpageUrl = `chrome-extension://${extensionId}/fullpage.html`;
    const page = await extensionContext.newPage();

    await page.goto(fullpageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root');

    await page.goto(`${fullpageUrl}#/send`, { waitUntil: 'domcontentloaded' });
    const sendFlow = page.getByTestId('send-flow');
    const sendVisible = await sendFlow.isVisible().catch(() => false);

    if (sendVisible) {
      const continueButtons = await sendFlow.getByRole('button', { name: /continue/i }).all();
      if (continueButtons.length > 0) {
        const disabledStates = await Promise.all(continueButtons.map(btn => btn.isDisabled()));
        expect(disabledStates.some(Boolean)).toBeTruthy();
      }
    } else {
      await expect(page.getByTestId('onboarding-welcome')).toBeVisible({ timeout: 10000 });
    }
  });

  test('receive page shows address and upload affordance', async ({ extensionContext, extensionId }) => {
    const fullpageUrl = `chrome-extension://${extensionId}/fullpage.html`;
    const page = await extensionContext.newPage();

    await page.goto(fullpageUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#root');

    await page.goto(`${fullpageUrl}#/receive`, { waitUntil: 'domcontentloaded' });

    const receiveContainer = page.getByTestId('receive-page');
    const receiveVisible = await receiveContainer.isVisible().catch(() => false);

    if (receiveVisible) {
      await expect(page.getByText(/your address/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /upload/i })).toBeVisible();
    } else {
      await expect(page.getByTestId('onboarding-welcome')).toBeVisible({ timeout: 10000 });
    }
  });
});
