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
  // Navigation header buttons
  // iOS: uses aria-label which is exposed as @label
  // Android WebView: aria-label is NOT exposed, so we use position-based selector
  // The nav buttons are icon-only (no visible text) and appear first in the button list
  get navBackButton() {
    if (isIOS()) {
      return '//XCUIElementTypeButton[@label="Go back"]';
    }
    // Android: first button with empty text (icon-only back button in header)
    return '(//android.widget.Button[@text=""])[1]';
  },
  get navCloseButton() {
    if (isIOS()) {
      return '//XCUIElementTypeButton[@label="Close"]';
    }
    // Android: first button with empty text (icon-only close button in header)
    return '(//android.widget.Button[@text=""])[1]';
  },

  // Explore page buttons - these are Link components with text in nested spans
  get sendButton() { return platformText('Send'); },
  get receiveButton() { return platformText('Receive'); },
  get faucetButton() { return platformText('Faucet'); },

  // Send flow - first step shows "Choose Token" title
  get sendFlow() { return platformText('Choose'); },
  // Token list - look for MIDEN token which should always be present
  get tokenList() { return platformText('MIDEN'); },
  // First token item (MIDEN)
  get firstTokenItem() { return platformText('MIDEN'); },
  get recipientInput() { return platformInputByIndex(1); },
  get amountInput() { return platformInputByIndex(2); },
  get reviewButton() { return platformButton('Review'); },
  get confirmSendButton() { return platformButton('Confirm'); },

  // Receive page
  get receivePage() { return platformText('Receive'); },
  // Address on Miden starts with "mtst1" not "0x"
  get addressDisplay() {
    if (isIOS()) {
      return '//XCUIElementTypeStaticText[contains(@label, "mtst1")]';
    }
    return '//*[contains(@text, "mtst1")]';
  },
  // Copy button has "Copy to clipboard" text on Android
  get copyAddressButton() {
    if (isIOS()) {
      return '//XCUIElementTypeButton[contains(@label, "Copy")]';
    }
    return '//*[@clickable="true" and contains(@text, "Copy to clipboard")]';
  },
  // Upload button has "Upload File" text
  get uploadButton() {
    if (isIOS()) {
      return '//XCUIElementTypeButton[contains(@label, "Upload")]';
    }
    return '//*[@clickable="true" and contains(@text, "Upload File")]';
  },
  // QR code - look for the image/canvas element in the QR area
  get qrCode() {
    if (isIOS()) {
      return '//XCUIElementTypeImage';
    }
    // Android: QR is rendered as Image or in a clickable container
    return '//android.widget.Image | //*[@clickable="true" and contains(@text, "Copy to clipboard")]';
  },

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
