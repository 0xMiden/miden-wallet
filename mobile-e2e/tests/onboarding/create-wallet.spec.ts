import { resetAppState, waitForAppReady, TEST_PASSWORD, dismissSystemAlerts } from '../../fixtures/app';
import { getSeedWordsFromBackup } from '../../fixtures/wallet';
import { Selectors, verifyWordSelector } from '../../helpers/selectors';
import {
  setPasswordInputs,
  disableBiometricsToggle,
  switchToNativeContext,
  switchToWebviewContext
} from '../../helpers/webview';

describe('Onboarding - Create Wallet', () => {
  beforeEach(async () => {
    await resetAppState();
  });

  // Tests that check partial flows should run first
  // The full flow test that creates a wallet should run last

  it('should display welcome screen on first launch', async () => {
    await waitForAppReady();

    const welcome = await $(Selectors.onboardingWelcome);
    await expect(welcome).toBeDisplayed();

    const createButton = await $(Selectors.createWalletButton);
    await expect(createButton).toBeDisplayed();

    const importButton = await $(Selectors.importWalletButton);
    await expect(importButton).toBeDisplayed();
  });

  it('should show 12 seed words on backup screen', async () => {
    await waitForAppReady();

    const createButton = await $(Selectors.createWalletButton);
    await createButton.click();

    // Dismiss any system alerts (notification permission may appear here)
    await dismissSystemAlerts();

    const showButton = await $(Selectors.showSeedPhraseButton);
    await showButton.waitForDisplayed({ timeout: 10000 });
    await showButton.click();

    // Brief wait for words to be visible
    await browser.pause(300);

    // Verify all 12 words are displayed via WebView JavaScript
    const seedWords = await getSeedWordsFromBackup();
    expect(seedWords.length).toBe(12);

    for (const word of seedWords) {
      expect(word.length).toBeGreaterThan(0);
    }
  });

  it('should require correct word selection during verification', async () => {
    await waitForAppReady();

    const createButton = await $(Selectors.createWalletButton);
    await createButton.click();

    // Dismiss any system alerts (notification permission may appear here)
    await dismissSystemAlerts();

    const showButton = await $(Selectors.showSeedPhraseButton);
    await showButton.waitForDisplayed({ timeout: 10000 });
    await showButton.click();

    // Brief wait for words to be visible
    await browser.pause(300);

    // Get the correct words via WebView JavaScript
    const seedWords = await getSeedWordsFromBackup();
    const firstWord = seedWords[0];

    // Switch to native context for button clicks
    await switchToNativeContext();
    const continueButton = await $(Selectors.continueButton);
    await continueButton.click();

    // On verification screen, the continue button should be disabled
    // until correct words are selected
    const verifySeedPhrase = await $(Selectors.verifySeedPhrase);
    await verifySeedPhrase.waitForDisplayed({ timeout: 10000 });

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

  // This test creates a wallet and should run LAST since it leaves the app
  // in a state where subsequent tests cannot start fresh without fullReset
  it('should complete create wallet flow and show Explore page', async () => {
    await waitForAppReady();

    // Click "Create a new wallet"
    const createButton = await $(Selectors.createWalletButton);
    await createButton.waitForDisplayed({ timeout: 10000 });
    await createButton.click();

    // Dismiss any system alerts (notification permission may appear here)
    await dismissSystemAlerts();

    // Wait for backup screen
    const showButton = await $(Selectors.showSeedPhraseButton);
    await showButton.waitForDisplayed({ timeout: 10000 });
    await showButton.click();

    // Brief wait for words to be visible
    await browser.pause(300);

    // Extract seed words for verification via WebView JavaScript
    const seedWords = await getSeedWordsFromBackup();

    expect(seedWords.length).toBe(12);
    expect(seedWords[0]).toBeTruthy();
    expect(seedWords[11]).toBeTruthy();

    // Click Continue (switch to native context first)
    await switchToNativeContext();
    const continueButton = await $(Selectors.continueButton);
    await continueButton.click();

    // Verify seed phrase screen
    const verifySeedPhrase = await $(Selectors.verifySeedPhrase);
    await verifySeedPhrase.waitForDisplayed({ timeout: 10000 });

    // Select first and last words
    const firstWordButton = await $(verifyWordSelector(seedWords[0]));
    await firstWordButton.waitForDisplayed({ timeout: 10000 });
    await firstWordButton.click();

    const lastWordButton = await $(verifyWordSelector(seedWords[11]));
    await lastWordButton.click();

    // Continue to password
    const verifyContinue = await $(Selectors.continueButton);
    await verifyContinue.click();

    // Wait for password screen
    const passwordScreen = await $(Selectors.createPassword);
    await passwordScreen.waitForDisplayed({ timeout: 10000 });

    // Use WebView JavaScript to set password values
    const passwordSuccess = await setPasswordInputs(TEST_PASSWORD, TEST_PASSWORD);
    if (!passwordSuccess) {
      throw new Error('Failed to set password inputs via WebView');
    }

    // Brief wait for biometric toggle to render (it loads async)
    await browser.pause(500);

    // Disable biometrics toggle to avoid Face ID prompt
    // Note: This may return false if biometrics not available on simulator
    const biometricDisabled = await disableBiometricsToggle();
    console.log('[Test] Biometric toggle disabled:', biometricDisabled);

    // Switch back to native context for button interactions
    await switchToNativeContext();
    await browser.pause(300);

    const passwordContinue = await $(Selectors.continueButton);
    await passwordContinue.waitForEnabled({ timeout: 10000 });
    await passwordContinue.click();

    // Complete onboarding - wait for wallet to be ready
    // Wallet creation involves key generation and node sync which can take 2+ minutes
    const getStartedButton = await $(Selectors.getStartedButton);
    await getStartedButton.waitForDisplayed({ timeout: 180000 });
    await getStartedButton.click();

    // Verify we're on Explore page
    const sendButton = await $(Selectors.sendButton);
    await sendButton.waitForDisplayed({ timeout: 30000 });
    await expect(sendButton).toBeDisplayed();

    const receiveButton = await $(Selectors.receiveButton);
    await expect(receiveButton).toBeDisplayed();
  });
});
