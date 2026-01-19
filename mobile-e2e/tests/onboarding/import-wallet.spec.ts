import {
  resetAppState,
  waitForAppReady,
  TEST_PASSWORD,
  TEST_MNEMONIC,
  triggerBiometricMatch
} from '../../fixtures/app';
import { Selectors, seedPhraseInputSelector } from '../../helpers/selectors';
import {
  setSeedPhraseInputs,
  setPasswordInputs,
  disableBiometricsToggle,
  switchToNativeContext
} from '../../helpers/webview';

describe('Onboarding - Import Wallet', () => {
  beforeEach(async () => {
    await resetAppState();
  });

  it('should show import options when clicking "I already have a wallet"', async () => {
    await waitForAppReady();

    const importButton = await $(Selectors.importWalletButton);
    await importButton.waitForDisplayed({ timeout: 15000 });
    await importButton.click();

    const importSelectType = await $(Selectors.importSelectType);
    await importSelectType.waitForDisplayed({ timeout: 15000 });

    const seedPhraseOption = await $(Selectors.importSeedPhraseOption);
    await expect(seedPhraseOption).toBeDisplayed();

    const fileOption = await $(Selectors.importFromFileOption);
    await expect(fileOption).toBeDisplayed();
  });

  it('should complete import wallet flow with seed phrase', async () => {
    await waitForAppReady();

    // Click "I already have a wallet"
    const importButton = await $(Selectors.importWalletButton);
    await importButton.click();

    // Select seed phrase import
    const seedPhraseOption = await $(Selectors.importSeedPhraseOption);
    await seedPhraseOption.waitForDisplayed({ timeout: 15000 });
    await seedPhraseOption.click();

    // Wait for seed phrase inputs to be visible
    const firstInput = await $(seedPhraseInputSelector(0));
    await firstInput.waitForDisplayed({ timeout: 5000 });

    // Use JavaScript in WebView context to set seed phrase values
    // This properly triggers React's onChange events
    const words = TEST_MNEMONIC.split(' ');
    const success = await setSeedPhraseInputs(words);
    if (!success) {
      throw new Error('Failed to set seed phrase inputs via WebView');
    }

    // Switch back to native context for button interactions
    await switchToNativeContext();
    await browser.pause(500);

    // Click Continue
    const continueButton = await $(Selectors.continueButton);
    await continueButton.waitForEnabled({ timeout: 10000 });
    await continueButton.click();

    // Set password - wait for password screen to load
    const passwordInput = await $(Selectors.passwordInput);
    await passwordInput.waitForDisplayed({ timeout: 15000 });

    // Use JavaScript in WebView context to set password values
    const passwordSuccess = await setPasswordInputs(TEST_PASSWORD, TEST_PASSWORD);
    if (!passwordSuccess) {
      throw new Error('Failed to set password inputs via WebView');
    }

    // Disable biometrics toggle to avoid Face ID prompt
    await disableBiometricsToggle();

    // Switch back to native context for button interactions
    await switchToNativeContext();
    await browser.pause(500);

    // Wait for Continue button to be enabled (passwords must match)
    const passwordContinue = await $(Selectors.continueButton);
    await passwordContinue.waitForEnabled({ timeout: 10000 });
    await passwordContinue.click();

    // Wait for wallet import to complete and Get started button to appear
    const getStartedButton = await $(Selectors.getStartedButton);
    await getStartedButton.waitForDisplayed({ timeout: 90000 });
    await getStartedButton.click();

    // Verify we're on Explore page
    const sendButton = await $(Selectors.sendButton);
    await sendButton.waitForDisplayed({ timeout: 30000 });
    await expect(sendButton).toBeDisplayed();

    const receiveButton = await $(Selectors.receiveButton);
    await expect(receiveButton).toBeDisplayed();
  });

  // Note: Tests for "should show 12 input fields" and "should accept valid BIP39 words"
  // are covered by the full import flow test above. Running them separately would require
  // clearing app data between tests, which significantly slows down the test suite.
});
