import { resetAppState, waitForAppReady, TEST_MNEMONIC } from '../../fixtures/app';
import { Selectors, seedPhraseInputSelector } from '../../helpers/selectors';

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

    const importSeedPhrase = await $(Selectors.importSeedPhrase);
    await importSeedPhrase.waitForDisplayed({ timeout: 15000 });

    // Enter an invalid word
    const firstInput = await $(seedPhraseInputSelector(0));
    await firstInput.setValue('notavalidword');

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

    // Enter all 12 valid words
    const words = TEST_MNEMONIC.split(' ');
    for (let i = 0; i < words.length; i++) {
      const input = await $(seedPhraseInputSelector(i));
      await input.waitForDisplayed({ timeout: 5000 });
      await input.setValue(words[i]);
    }

    // Continue button should be enabled
    const continueButton = await $(Selectors.continueButton);
    await browser.pause(500); // Wait for validation
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

    // Enter 11 valid words and 1 invalid
    const validWords = TEST_MNEMONIC.split(' ').slice(0, 11);
    for (let i = 0; i < validWords.length; i++) {
      const input = await $(seedPhraseInputSelector(i));
      await input.setValue(validWords[i]);
    }

    // Last word is invalid
    const lastInput = await $(seedPhraseInputSelector(11));
    await lastInput.setValue('invalidword123');

    // Continue should still be disabled
    const continueButton = await $(Selectors.continueButton);
    await browser.pause(500);
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

    // Enter words with extra whitespace
    const words = TEST_MNEMONIC.split(' ');
    for (let i = 0; i < words.length; i++) {
      const input = await $(seedPhraseInputSelector(i));
      await input.setValue(`  ${words[i]}  `); // Extra whitespace
    }

    // Should still work after trimming
    const continueButton = await $(Selectors.continueButton);
    await browser.pause(500);
    const isEnabled = await continueButton.isEnabled();
    expect(isEnabled).toBe(true);
  });
});
