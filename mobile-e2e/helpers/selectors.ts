/**
 * Cross-platform selectors for mobile e2e tests
 *
 * Uses XPath selectors for iOS native context.
 * Elements in WebView apps are accessible via native accessibility hierarchy.
 */

/**
 * Context tracking (currently unused, but kept for future use)
 */
let isInWebView = false;

export function setWebViewContext(inWebView: boolean): void {
  isInWebView = inWebView;
}

export function getIsInWebView(): boolean {
  return isInWebView;
}

/**
 * Check if running on iOS (must be called at runtime)
 */
function isIOS(): boolean {
  // @ts-expect-error - driver is global in wdio
  return typeof driver !== 'undefined' && driver.isIOS;
}

/**
 * Helper to create platform-aware button selector
 */
function platformButton(label: string): string {
  if (isIOS()) {
    return `//XCUIElementTypeButton[@label="${label}" or contains(@label, "${label}")]`;
  }
  // Android: look for clickable elements with text
  return `//*[@clickable="true" and (contains(@text, "${label}") or contains(@content-desc, "${label}"))]`;
}

/**
 * Helper to create platform-aware text selector
 */
function platformText(text: string): string {
  if (isIOS()) {
    return `//*[contains(@label, "${text}") or contains(@value, "${text}")]`;
  }
  // Android: look for elements with text or content-desc
  return `//*[contains(@text, "${text}") or contains(@content-desc, "${text}")]`;
}

/**
 * Helper to create platform-aware text field selector by index
 */
function platformInputByIndex(index: number): string {
  if (isIOS()) {
    return `(//XCUIElementTypeTextField | //XCUIElementTypeSecureTextField)[${index}]`;
  }
  // Android: EditText fields
  return `(//android.widget.EditText)[${index}]`;
}

// Keep iOS-specific helpers for backward compatibility
function iosButton(label: string): string {
  return `//XCUIElementTypeButton[@label="${label}" or contains(@label, "${label}")]`;
}

function iosText(text: string): string {
  return `//*[contains(@label, "${text}") or contains(@value, "${text}")]`;
}

function iosInputByIndex(index: number): string {
  return `(//XCUIElementTypeTextField | //XCUIElementTypeSecureTextField)[${index}]`;
}

/**
 * Dynamic selectors that resolve at runtime based on platform
 * Note: These are getter functions to evaluate platform at test runtime
 */
export const Selectors = {
  // Onboarding - using visible button text
  get onboardingWelcome() { return platformText('Create a new wallet'); },
  get createWalletButton() { return platformButton('Create a new wallet'); },
  get importWalletButton() { return platformButton('I already have a wallet'); },
  get showSeedPhraseButton() { return platformButton('Show'); },
  get backupSeedPhrase() { return platformText('Backup seed phrase'); },
  get verifySeedPhrase() { return platformText('Verify Seed Phrase'); },
  get importSelectType() { return platformText('Choose Your Import Type'); },
  get importSeedPhraseOption() { return platformText('Import with Seed Phrase'); },
  get importFromFileOption() { return platformText('Import with Encrypted Wallet File'); },
  get importSeedPhrase() { return platformText('12-word Seed phrase'); },
  get confirmationScreen() { return platformText('Your wallet is ready'); },
  get createPassword() { return platformText('Create password'); },

  // Password inputs - use index-based selection
  get passwordInput() { return platformInputByIndex(1); },
  get confirmPasswordInput() { return platformInputByIndex(2); },
  get unlockPasswordInput() { return platformInputByIndex(1); },
  get unlockButton() { return platformButton('Unlock'); },

  // Navigation buttons
  get continueButton() { return platformButton('Continue'); },
  get backButton() { return platformButton('Back'); },
  get getStartedButton() { return platformButton('Get started'); },

  // Explore page buttons - these are Link components with text in nested spans
  get sendButton() { return platformText('Send'); },
  get receiveButton() { return platformText('Receive'); },
  get faucetButton() { return platformText('Faucet'); },

  // Send flow
  get sendFlow() { return platformText('Send'); },
  get recipientInput() { return platformInputByIndex(1); },
  get amountInput() { return platformInputByIndex(2); },
  get reviewButton() { return platformButton('Review'); },
  get confirmSendButton() { return platformButton('Confirm'); },

  // Receive page
  get receivePage() { return platformText('Receive'); },
  get addressDisplay() { return isIOS() ? '//XCUIElementTypeStaticText[contains(@label, "0x")]' : '//*[contains(@text, "0x")]'; },
  get uploadButton() { return platformButton('Upload'); },

  // Settings
  get settingsTab() { return platformButton('Settings'); },
  get generalSettings() { return platformText('General'); },
  get advancedSettings() { return platformText('Advanced'); },

  // DApp Browser
  get browserTab() { return platformButton('Browser'); },
  get browserUrlInput() { return isIOS() ? '//XCUIElementTypeTextField' : '//android.widget.EditText'; },
  get browserGoButton() { return platformButton('Go'); },

  // Common
  root: '#root',
  get loadingSpinner() { return platformText('Loading'); },
  get errorMessage() {
    return isIOS()
      ? '//XCUIElementTypeStaticText[contains(@label, "error") or contains(@label, "Error")]'
      : '//*[contains(@text, "error") or contains(@text, "Error")]';
  },
  get successMessage() {
    return isIOS()
      ? '//XCUIElementTypeStaticText[contains(@label, "success") or contains(@label, "Success")]'
      : '//*[contains(@text, "success") or contains(@text, "Success")]';
  },

  // DApp Browser - connection/transaction modals
  get approveConnectionButton() { return platformButton('Approve'); },
  get rejectConnectionButton() { return platformButton('Reject'); },
  get confirmTransactionButton() { return platformButton('Confirm'); },
  get rejectTransactionButton() { return platformButton('Reject'); },
  get transactionConfirmationOverlay() { return platformText('Confirm Transaction'); },
  get copyAddressButton() { return platformButton('Copy'); },
};

/**
 * Get a token item selector by index
 */
export function tokenItemSelector(index: number): string {
  return `(//XCUIElementTypeButton)[${index + 1}]`;
}

/**
 * Get a seed word selector by index
 */
export function seedWordSelector(index: number): string {
  return `(//XCUIElementTypeStaticText)[${index + 1}]`;
}

/**
 * Get a seed word text selector by index (the actual word text)
 */
export function seedWordTextSelector(index: number): string {
  return seedWordSelector(index);
}

/**
 * Get a seed phrase input selector by index
 */
export function seedPhraseInputSelector(index: number): string {
  if (isIOS()) {
    return `(//XCUIElementTypeTextField)[${index + 1}]`;
  }
  return `(//android.widget.EditText)[${index + 1}]`;
}

/**
 * Get a verify word button selector
 */
export function verifyWordSelector(word: string): string {
  if (isIOS()) {
    return `//XCUIElementTypeButton[contains(@label, "${word}")]`;
  }
  return `//*[@clickable="true" and contains(@text, "${word}")]`;
}

/**
 * Platform-specific XPath selectors (for reference)
 */
export const XPathSelectors = {
  // iOS-specific
  ios: {
    textContaining: (text: string) => `//XCUIElementTypeStaticText[contains(@label, "${text}")]`,
    buttonWithText: (text: string) => `//XCUIElementTypeButton[contains(@label, "${text}")]`,
    inputField: '//XCUIElementTypeTextField',
    secureInputField: '//XCUIElementTypeSecureTextField',
  },

  // Android-specific
  android: {
    textContaining: (text: string) => `//*[contains(@text, "${text}")]`,
    buttonWithText: (text: string) =>
      `//android.widget.Button[contains(@text, "${text}")] | //android.view.View[contains(@text, "${text}") and @clickable="true"]`,
    inputField: '//android.widget.EditText',
  },
} as const;

/**
 * Get platform-specific text selector
 */
export function textSelector(text: string): string {
  // @ts-expect-error - driver is global in wdio
  if (typeof driver !== 'undefined' && driver.isIOS) {
    return XPathSelectors.ios.textContaining(text);
  }
  return XPathSelectors.android.textContaining(text);
}

/**
 * Get platform-specific button selector
 */
export function buttonSelector(text: string): string {
  // @ts-expect-error - driver is global in wdio
  if (typeof driver !== 'undefined' && driver.isIOS) {
    return XPathSelectors.ios.buttonWithText(text);
  }
  return XPathSelectors.android.buttonWithText(text);
}
