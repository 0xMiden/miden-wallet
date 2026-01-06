import { expect, test } from '../fixtures/extension';

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

  test('onboarding create flow shows verify screen and word options', async ({ extensionContext, extensionId }) => {
    const fullpageUrl = `chrome-extension://${extensionId}/fullpage.html`;
    const page = await extensionContext.newPage();

    await page.goto(fullpageUrl, { waitUntil: 'domcontentloaded' });

    await page.getByTestId('onboarding-welcome').getByRole('button', { name: /create a new wallet/i }).click();

    await page.getByText(/back up your wallet/i).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: /show/i }).click();

    const seedWords = await page.$$eval('article label', labels =>
      labels.map(label => label.textContent?.trim() || '')
    );
    const tenthWord = seedWords[9]?.split('.').pop()?.trim();

    await page.getByRole('button', { name: /continue/i }).click();

    await page.getByTestId('verify-seed-phrase').waitFor({ timeout: 15000 });
    if (!tenthWord) {
      throw new Error('Failed to read seed word from backup screen');
    }
    const options = await page.getByRole('button').allTextContents();
    expect(options.some(text => text.trim().length > 0)).toBeTruthy();
  });

  test('onboarding import flow via seed entry reaches password screen', async ({ extensionContext, extensionId }) => {
    const fullpageUrl = `chrome-extension://${extensionId}/fullpage.html`;
    const page = await extensionContext.newPage();

    await page.goto(fullpageUrl, { waitUntil: 'domcontentloaded' });

    await page.getByTestId('onboarding-welcome').getByRole('button', { name: /i already have a wallet/i }).click();
    await page.getByTestId('import-select-type').waitFor({ timeout: 15000 });

    await page.getByTestId('import-select-type').getByText(/import with seed phrase/i).click();

    const words = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(
      ' '
    );
    for (let i = 0; i < words.length; i++) {
      await page.locator(`#seed-phrase-input-${i}`).fill(words[i]);
    }
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page).toHaveURL(/create-password/);
    await page.locator('input[placeholder=\"Enter password\"]').first().fill('Password123!');
    await page.locator('input[placeholder=\"Enter password again\"]').first().fill('Password123!');
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByText(/your wallet is ready/i)).toBeVisible();
  });
});
