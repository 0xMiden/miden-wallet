/**
 * Wallet fixtures for mobile e2e tests
 * Provides helpers to set up wallet state for testing
 */

import { TEST_MNEMONIC, TEST_PASSWORD, triggerBiometricMatch, waitForAppReady } from './app';
import { Selectors, verifyWordSelector } from '../helpers/selectors';
import { $ } from '@wdio/globals';
import {
  setSeedPhraseInputs,
  setPasswordInputs,
  setUnlockPasswordInput,
  disableBiometricsToggle,
  switchToNativeContext,
  switchToWebviewContext
} from '../helpers/webview';

/**
 * Get seed words from the backup screen via WebView JavaScript
 * Returns array of 12 seed words
 */
export async function getSeedWordsFromBackup(): Promise<string[]> {
  await switchToWebviewContext();

  const words = await browser.execute(() => {
    const seedWords: string[] = [];
    for (let i = 0; i < 12; i++) {
      const el = document.querySelector(`[data-testid="seed-word-text-${i}"]`);
      if (el && el.textContent) {
        seedWords.push(el.textContent.trim());
      }
    }
    return seedWords;
  });

  await switchToNativeContext();
  return words as string[];
}

/**
 * Complete the onboarding flow to create a new wallet
 */
export async function createNewWallet(password: string = TEST_PASSWORD): Promise<void> {
  await waitForAppReady();

  // Click "Create a new wallet"
  const createButton = await $(Selectors.createWalletButton);
  await createButton.waitForDisplayed({ timeout: 10000 });
  await createButton.click();

  // Wait for backup screen and click "Show"
  const showButton = await $(Selectors.showSeedPhraseButton);
  await showButton.waitForDisplayed({ timeout: 10000 });
  await showButton.click();

  // Brief wait for words to be visible
  await browser.pause(300);

  // Get seed words for verification via WebView JavaScript
  const seedWords = await getSeedWordsFromBackup();

  if (seedWords.length !== 12) {
    throw new Error(`Expected 12 seed words, got ${seedWords.length}`);
  }

  // Click Continue
  await switchToNativeContext();
  const continueButton = await $(Selectors.continueButton);
  await continueButton.click();

  // Verify seed phrase - select first and last words
  const firstWordButton = await $(verifyWordSelector(seedWords[0]));
  await firstWordButton.waitForDisplayed({ timeout: 10000 });
  await firstWordButton.click();

  const lastWordButton = await $(verifyWordSelector(seedWords[11]));
  await lastWordButton.click();

  const verifyContinue = await $(Selectors.continueButton);
  await verifyContinue.click();

  // Set password
  await setPasswordWithWebView(password);

  // Complete onboarding
  const getStartedButton = await $(Selectors.getStartedButton);
  await getStartedButton.waitForDisplayed({ timeout: 180000 });
  await getStartedButton.click();

  // Wait for explore page
  const sendButton = await $(Selectors.sendButton);
  await sendButton.waitForDisplayed({ timeout: 30000 });
}

/**
 * Complete the onboarding flow to import a wallet from seed phrase
 */
export async function importWalletFromSeed(
  mnemonic: string = TEST_MNEMONIC,
  password: string = TEST_PASSWORD
): Promise<void> {
  await waitForAppReady();

  // Click "I already have a wallet"
  const importButton = await $(Selectors.importWalletButton);
  await importButton.waitForDisplayed({ timeout: 10000 });
  await importButton.click();

  // Select "Import with seed phrase"
  const seedPhraseOption = await $(Selectors.importSeedPhraseOption);
  await seedPhraseOption.waitForDisplayed({ timeout: 10000 });
  await seedPhraseOption.click();

  // Brief wait for seed phrase inputs to be visible
  await browser.pause(300);

  // Enter seed words via WebView JavaScript
  const words = mnemonic.split(' ');
  const success = await setSeedPhraseInputs(words);
  if (!success) {
    throw new Error('Failed to set seed phrase inputs via WebView');
  }

  // Switch back to native context for button interactions
  await switchToNativeContext();
  await browser.pause(300);

  // Click Continue
  const continueButton = await $(Selectors.continueButton);
  await continueButton.waitForEnabled({ timeout: 5000 });
  await continueButton.click();

  // Set password
  await setPasswordWithWebView(password);

  // Complete onboarding
  const getStartedButton = await $(Selectors.getStartedButton);
  await getStartedButton.waitForDisplayed({ timeout: 180000 });
  await getStartedButton.click();

  // Wait for explore page
  const sendButton = await $(Selectors.sendButton);
  await sendButton.waitForDisplayed({ timeout: 30000 });
}

/**
 * Set password during onboarding using WebView JavaScript
 * This properly triggers React events unlike native Appium typing
 */
async function setPasswordWithWebView(password: string): Promise<void> {
  // First wait for the password screen to be displayed
  const passwordScreen = await $(Selectors.createPassword);
  await passwordScreen.waitForDisplayed({ timeout: 10000 });

  // Brief pause to ensure screen transition is complete
  await browser.pause(300);

  // Use WebView JavaScript to set password values
  const success = await setPasswordInputs(password, password);
  if (!success) {
    throw new Error('Failed to set password inputs via WebView');
  }

  // Disable biometrics toggle to avoid Face ID prompt
  await disableBiometricsToggle();

  // Switch back to native context for button interactions
  await switchToNativeContext();
  await browser.pause(300);

  // Wait for continue button and click
  const continueButton = await $(Selectors.continueButton);
  await continueButton.waitForEnabled({ timeout: 5000 });
  await continueButton.click();
}

/**
 * Unlock the wallet with password
 */
export async function unlockWallet(password: string = TEST_PASSWORD): Promise<void> {
  // Wait for unlock screen
  const unlockButton = await $(Selectors.unlockButton);
  await unlockButton.waitForDisplayed({ timeout: 10000 });

  // Use WebView JavaScript to set password
  const success = await setUnlockPasswordInput(password);
  if (!success) {
    throw new Error('Failed to set unlock password via WebView');
  }

  // Switch back to native context for button click
  await switchToNativeContext();
  await browser.pause(300);

  await unlockButton.click();

  // Wait for explore page
  const sendButton = await $(Selectors.sendButton);
  await sendButton.waitForDisplayed({ timeout: 15000 });
}

/**
 * Unlock the wallet with biometrics
 */
export async function unlockWalletWithBiometrics(): Promise<void> {
  // Wait for biometric prompt to appear
  await browser.pause(500);

  // Trigger biometric match
  await triggerBiometricMatch();

  // Wait for explore page
  const sendButton = await $(Selectors.sendButton);
  await sendButton.waitForDisplayed({ timeout: 15000 });
}

/**
 * Ensure wallet is in ready state (unlocked, on explore page)
 * Will create wallet if needed, unlock if locked
 */
export async function ensureWalletReady(): Promise<void> {
  await waitForAppReady();

  // Check if we're on onboarding
  try {
    const welcome = await $(Selectors.onboardingWelcome);
    const isOnboarding = await welcome.isDisplayed();
    if (isOnboarding) {
      await importWalletFromSeed();
      return;
    }
  } catch {
    // Not on onboarding
  }

  // Check if wallet is locked
  try {
    const unlockInput = await $(Selectors.unlockPasswordInput);
    const isLocked = await unlockInput.isDisplayed();
    if (isLocked) {
      await unlockWallet();
      return;
    }
  } catch {
    // Not locked
  }

  // Check if already on explore page
  try {
    const sendButton = await $(Selectors.sendButton);
    await sendButton.waitForDisplayed({ timeout: 5000 });
  } catch {
    throw new Error('Wallet is in unknown state');
  }
}
