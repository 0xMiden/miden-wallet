/**
 * Wallet fixtures for mobile e2e tests
 * Provides helpers to set up wallet state for testing
 */

import { TEST_MNEMONIC, TEST_PASSWORD, triggerBiometricMatch, waitForAppReady } from './app';
import { Selectors, seedWordSelector, seedPhraseInputSelector, verifyWordSelector } from '../helpers/selectors';
import { $ } from '@wdio/globals';

/**
 * Complete the onboarding flow to create a new wallet
 */
export async function createNewWallet(password: string = TEST_PASSWORD): Promise<void> {
  await waitForAppReady();

  // Click "Create a new wallet"
  const createButton = await $(Selectors.createWalletButton);
  await createButton.waitForDisplayed({ timeout: 15000 });
  await createButton.click();

  // Wait for backup screen and click "Show"
  const showButton = await $(Selectors.showSeedPhraseButton);
  await showButton.waitForDisplayed({ timeout: 15000 });
  await showButton.click();

  // Get seed words for verification
  const seedWords: string[] = [];
  for (let i = 0; i < 12; i++) {
    const wordElement = await $(seedWordSelector(i));
    const text = await wordElement.getText();
    seedWords.push(text);
  }

  // Click Continue
  const continueButton = await $(Selectors.continueButton);
  await continueButton.click();

  // Verify seed phrase - select first and last words
  const firstWordButton = await $(verifyWordSelector(seedWords[0]));
  await firstWordButton.waitForDisplayed({ timeout: 15000 });
  await firstWordButton.click();

  const lastWordButton = await $(verifyWordSelector(seedWords[11]));
  await lastWordButton.click();

  const verifyContinue = await $(Selectors.continueButton);
  await verifyContinue.click();

  // Set password
  await setPassword(password);

  // Complete onboarding
  const getStartedButton = await $(Selectors.getStartedButton);
  await getStartedButton.waitForDisplayed({ timeout: 30000 });
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
  await importButton.waitForDisplayed({ timeout: 15000 });
  await importButton.click();

  // Select "Import with seed phrase"
  const seedPhraseOption = await $(Selectors.importSeedPhraseOption);
  await seedPhraseOption.waitForDisplayed({ timeout: 15000 });
  await seedPhraseOption.click();

  // Enter seed words
  const words = mnemonic.split(' ');
  for (let i = 0; i < words.length; i++) {
    const input = await $(seedPhraseInputSelector(i));
    await input.waitForDisplayed({ timeout: 5000 });
    await input.setValue(words[i]);
  }

  // Click Continue
  const continueButton = await $(Selectors.continueButton);
  await continueButton.click();

  // Set password
  await setPassword(password);

  // Complete onboarding
  const getStartedButton = await $(Selectors.getStartedButton);
  await getStartedButton.waitForDisplayed({ timeout: 30000 });
  await getStartedButton.click();

  // Wait for explore page
  const sendButton = await $(Selectors.sendButton);
  await sendButton.waitForDisplayed({ timeout: 30000 });
}

/**
 * Set password during onboarding
 */
async function setPassword(password: string): Promise<void> {
  // First wait for the password screen to be displayed
  const passwordScreen = await $(Selectors.createPassword);
  await passwordScreen.waitForDisplayed({ timeout: 15000 });

  // Small pause to ensure screen transition is complete
  await browser.pause(500);

  // Find and fill password inputs
  const passwordInput = await $(Selectors.passwordInput);
  await passwordInput.waitForDisplayed({ timeout: 10000 });
  await passwordInput.setValue(password);

  // Small pause between inputs
  await browser.pause(300);

  const confirmInput = await $(Selectors.confirmPasswordInput);
  await confirmInput.waitForDisplayed({ timeout: 5000 });
  await confirmInput.setValue(password);

  // Wait for continue button and click
  await browser.pause(300);
  const continueButton = await $(Selectors.continueButton);
  await continueButton.waitForDisplayed({ timeout: 5000 });
  await continueButton.click();
}

/**
 * Unlock the wallet with password
 */
export async function unlockWallet(password: string = TEST_PASSWORD): Promise<void> {
  const passwordInput = await $(Selectors.unlockPasswordInput);
  await passwordInput.waitForDisplayed({ timeout: 15000 });
  await passwordInput.setValue(password);

  const unlockButton = await $(Selectors.unlockButton);
  await unlockButton.click();

  // Wait for explore page
  const sendButton = await $(Selectors.sendButton);
  await sendButton.waitForDisplayed({ timeout: 30000 });
}

/**
 * Unlock the wallet with biometrics
 */
export async function unlockWalletWithBiometrics(): Promise<void> {
  // Wait for biometric prompt to appear
  await browser.pause(1000);

  // Trigger biometric match
  await triggerBiometricMatch();

  // Wait for explore page
  const sendButton = await $(Selectors.sendButton);
  await sendButton.waitForDisplayed({ timeout: 30000 });
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
