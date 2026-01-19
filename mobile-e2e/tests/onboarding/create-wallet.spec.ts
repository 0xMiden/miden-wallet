import { resetAppState, waitForAppReady, TEST_PASSWORD } from '../../fixtures/app';
import { Selectors, seedWordSelector, verifyWordSelector } from '../../helpers/selectors';

describe('Onboarding - Create Wallet', () => {
  beforeEach(async () => {
    await resetAppState();
  });

  it('should display welcome screen on first launch', async () => {
    await waitForAppReady();

    const welcome = await $(Selectors.onboardingWelcome);
    await expect(welcome).toBeDisplayed();

    const createButton = await $(Selectors.createWalletButton);
    await expect(createButton).toBeDisplayed();

    const importButton = await $(Selectors.importWalletButton);
    await expect(importButton).toBeDisplayed();
  });

  it('should complete create wallet flow and show Explore page', async () => {
    await waitForAppReady();

    // Click "Create a new wallet"
    const createButton = await $(Selectors.createWalletButton);
    await createButton.waitForDisplayed({ timeout: 15000 });
    await createButton.click();

    // Wait for backup screen
    const showButton = await $(Selectors.showSeedPhraseButton);
    await showButton.waitForDisplayed({ timeout: 15000 });
    await showButton.click();

    // Extract seed words for verification
    const seedWords: string[] = [];
    for (let i = 0; i < 12; i++) {
      const wordElement = await $(seedWordSelector(i));
      await wordElement.waitForDisplayed({ timeout: 5000 });
      const text = await wordElement.getText();
      seedWords.push(text);
    }

    expect(seedWords.length).toBe(12);
    expect(seedWords[0]).toBeTruthy();
    expect(seedWords[11]).toBeTruthy();

    // Click Continue
    const continueButton = await $(Selectors.continueButton);
    await continueButton.click();

    // Verify seed phrase screen
    const verifySeedPhrase = await $(Selectors.verifySeedPhrase);
    await verifySeedPhrase.waitForDisplayed({ timeout: 15000 });

    // Select first and last words
    const firstWordButton = await $(verifyWordSelector(seedWords[0]));
    await firstWordButton.waitForDisplayed({ timeout: 10000 });
    await firstWordButton.click();

    const lastWordButton = await $(verifyWordSelector(seedWords[11]));
    await lastWordButton.click();

    // Continue to password
    const verifyContinue = await $(Selectors.continueButton);
    await verifyContinue.click();

    // Set password
    const passwordInput = await $(Selectors.passwordInput);
    await passwordInput.waitForDisplayed({ timeout: 15000 });
    await passwordInput.setValue(TEST_PASSWORD);

    const confirmInput = await $(Selectors.confirmPasswordInput);
    await confirmInput.setValue(TEST_PASSWORD);

    const passwordContinue = await $(Selectors.continueButton);
    await passwordContinue.click();

    // Complete onboarding
    const getStartedButton = await $(Selectors.getStartedButton);
    await getStartedButton.waitForDisplayed({ timeout: 30000 });
    await getStartedButton.click();

    // Verify we're on Explore page
    const sendButton = await $(Selectors.sendButton);
    await sendButton.waitForDisplayed({ timeout: 30000 });
    await expect(sendButton).toBeDisplayed();

    const receiveButton = await $(Selectors.receiveButton);
    await expect(receiveButton).toBeDisplayed();
  });

  it('should show 12 seed words on backup screen', async () => {
    await waitForAppReady();

    const createButton = await $(Selectors.createWalletButton);
    await createButton.click();

    const showButton = await $(Selectors.showSeedPhraseButton);
    await showButton.waitForDisplayed({ timeout: 15000 });
    await showButton.click();

    // Verify all 12 words are displayed
    for (let i = 0; i < 12; i++) {
      const wordElement = await $(seedWordSelector(i));
      await expect(wordElement).toBeDisplayed();
      const text = await wordElement.getText();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it('should require correct word selection during verification', async () => {
    await waitForAppReady();

    const createButton = await $(Selectors.createWalletButton);
    await createButton.click();

    const showButton = await $(Selectors.showSeedPhraseButton);
    await showButton.waitForDisplayed({ timeout: 15000 });
    await showButton.click();

    // Get the correct words
    const firstWordElement = await $(seedWordSelector(0));
    const firstWord = await firstWordElement.getText();

    const continueButton = await $(Selectors.continueButton);
    await continueButton.click();

    // On verification screen, the continue button should be disabled
    // until correct words are selected
    const verifySeedPhrase = await $(Selectors.verifySeedPhrase);
    await verifySeedPhrase.waitForDisplayed({ timeout: 15000 });

    const verifyContinue = await $(Selectors.continueButton);

    // Initially should be disabled (or not clickable)
    const isEnabled = await verifyContinue.isEnabled();
    expect(isEnabled).toBe(false);

    // Select first correct word
    const firstWordButton = await $(verifyWordSelector(firstWord));
    await firstWordButton.click();

    // Still should not be enabled (need both words)
    const stillDisabled = await verifyContinue.isEnabled();
    expect(stillDisabled).toBe(false);
  });
});
