import { resetAppState, waitForAppReady, TEST_MNEMONIC } from '../../fixtures/app';
import { Selectors, seedPhraseInputSelector } from '../../helpers/selectors';
import {
  setSeedPhraseInputs,
  switchToNativeContext,
  switchToWebviewContext,
  getCurrentContext
} from '../../helpers/webview';

/**
 * Helper to set a single seed phrase input via WebView JavaScript
 * Switches to WebView context if needed
 */
async function setSingleSeedInput(index: number, value: string): Promise<boolean> {
  const currentContext = await getCurrentContext();
  const isInWebview = currentContext.includes('WEBVIEW');

  if (!isInWebview) {
    await switchToWebviewContext();
  }

  const result = await browser.execute(
    (idx: number, val: string) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      const input = document.querySelector(`[data-testid="seed-phrase-input-${idx}"]`) as HTMLInputElement;
      if (!input) {
        return false;
      }

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, val);
      } else {
        input.value = val;
      }

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));

      return true;
    },
    index,
    value
  );

  if (!isInWebview) {
    await switchToNativeContext();
  }

  return result as boolean;
}

describe('Onboarding - Seed Phrase Validation', () => {
  beforeEach(async () => {
    await resetAppState();
  });

  it('should disable continue button with invalid seed phrase', async () => {
    await waitForAppReady();

    const importButton = await $(Selectors.importWalletButton);
    await importButton.click();

    const seedPhraseOption = await $(Selectors.importSeedPhraseOption);
    await seedPhraseOption.waitForDisplayed({ timeout: 15000 });
    await seedPhraseOption.click();

    // Wait for seed phrase inputs to be visible
    const firstInput = await $(seedPhraseInputSelector(0));
    await firstInput.waitForDisplayed({ timeout: 5000 });

    // Enter an invalid word via WebView JavaScript
    await setSingleSeedInput(0, 'notavalidword');

    // Switch back to native context
    await switchToNativeContext();
    await browser.pause(500);

    // Continue button should be disabled
    const continueButton = await $(Selectors.continueButton);
    const isEnabled = await continueButton.isEnabled();
    expect(isEnabled).toBe(false);
  });

  it('should enable continue button with valid 12-word seed phrase', async () => {
    await waitForAppReady();

    const importButton = await $(Selectors.importWalletButton);
    await importButton.click();

    const seedPhraseOption = await $(Selectors.importSeedPhraseOption);
    await seedPhraseOption.waitForDisplayed({ timeout: 15000 });
    await seedPhraseOption.click();

    // Wait for seed phrase inputs to be visible
    const firstInput = await $(seedPhraseInputSelector(0));
    await firstInput.waitForDisplayed({ timeout: 5000 });

    // Enter all 12 valid words via WebView JavaScript
    const words = TEST_MNEMONIC.split(' ');
    const success = await setSeedPhraseInputs(words);
    expect(success).toBe(true);

    // Switch back to native context
    await switchToNativeContext();
    await browser.pause(500);

    // Continue button should be enabled
    const continueButton = await $(Selectors.continueButton);
    const isEnabled = await continueButton.isEnabled();
    expect(isEnabled).toBe(true);
  });

  it('should validate each word as a valid BIP39 word', async () => {
    await waitForAppReady();

    const importButton = await $(Selectors.importWalletButton);
    await importButton.click();

    const seedPhraseOption = await $(Selectors.importSeedPhraseOption);
    await seedPhraseOption.waitForDisplayed({ timeout: 15000 });
    await seedPhraseOption.click();

    // Wait for seed phrase inputs to be visible
    const firstInput = await $(seedPhraseInputSelector(0));
    await firstInput.waitForDisplayed({ timeout: 5000 });

    // Enter 11 valid words and 1 invalid via WebView JavaScript
    const validWords = TEST_MNEMONIC.split(' ').slice(0, 11);
    for (let i = 0; i < validWords.length; i++) {
      await setSingleSeedInput(i, validWords[i]);
    }

    // Last word is invalid
    await setSingleSeedInput(11, 'invalidword123');

    // Switch back to native context
    await switchToNativeContext();
    await browser.pause(500);

    // Continue should still be disabled
    const continueButton = await $(Selectors.continueButton);
    const isEnabled = await continueButton.isEnabled();
    expect(isEnabled).toBe(false);
  });

  it('should reject empty seed phrase', async () => {
    await waitForAppReady();

    const importButton = await $(Selectors.importWalletButton);
    await importButton.click();

    const seedPhraseOption = await $(Selectors.importSeedPhraseOption);
    await seedPhraseOption.waitForDisplayed({ timeout: 15000 });
    await seedPhraseOption.click();

    // Wait for seed phrase inputs to be visible
    const firstInput = await $(seedPhraseInputSelector(0));
    await firstInput.waitForDisplayed({ timeout: 5000 });

    // Don't enter any words, just check continue is disabled
    const continueButton = await $(Selectors.continueButton);
    const isEnabled = await continueButton.isEnabled();
    expect(isEnabled).toBe(false);
  });

  it('should trim whitespace from seed words', async () => {
    await waitForAppReady();

    const importButton = await $(Selectors.importWalletButton);
    await importButton.click();

    const seedPhraseOption = await $(Selectors.importSeedPhraseOption);
    await seedPhraseOption.waitForDisplayed({ timeout: 15000 });
    await seedPhraseOption.click();

    // Wait for seed phrase inputs to be visible
    const firstInput = await $(seedPhraseInputSelector(0));
    await firstInput.waitForDisplayed({ timeout: 5000 });

    // Enter words with extra whitespace via WebView JavaScript
    const words = TEST_MNEMONIC.split(' ');
    for (let i = 0; i < words.length; i++) {
      await setSingleSeedInput(i, `  ${words[i]}  `);
    }

    // Switch back to native context
    await switchToNativeContext();
    await browser.pause(500);

    // Should still work after trimming
    const continueButton = await $(Selectors.continueButton);
    const isEnabled = await continueButton.isEnabled();
    expect(isEnabled).toBe(true);
  });
});
