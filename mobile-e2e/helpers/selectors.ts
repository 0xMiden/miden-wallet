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
 * Helper to create iOS XPath by button label
 */
function iosButton(label: string): string {
  return `//XCUIElementTypeButton[@label="${label}" or contains(@label, "${label}")]`;
}

/**
 * Helper to create iOS XPath for any element containing text
 */
function iosText(text: string): string {
  return `//*[contains(@label, "${text}") or contains(@value, "${text}")]`;
}

/**
 * Helper to create iOS XPath for text field by index
 */
function iosInputByIndex(index: number): string {
  return `(//XCUIElementTypeTextField | //XCUIElementTypeSecureTextField)[${index}]`;
}

/**
 * Platform-aware selectors for iOS native context
 */
export const Selectors = {
  // Onboarding - using visible button text
  onboardingWelcome: iosText('Create a new wallet'),
  createWalletButton: iosButton('Create a new wallet'),
  importWalletButton: iosButton('I already have a wallet'),
  showSeedPhraseButton: iosButton('Show'),
  backupSeedPhrase: iosText('Backup seed phrase'),
  verifySeedPhrase: iosText('Verify Seed Phrase'),
  importSelectType: iosText('Choose Your Import Type'),
  importSeedPhraseOption: iosText('Import with Seed Phrase'),
  importFromFileOption: iosText('Import with Encrypted Wallet File'),
  importSeedPhrase: iosText('12-word Seed phrase'),
  confirmationScreen: iosText('Your wallet is ready'),
  createPassword: iosText('Create password'),

  // Password inputs - use index-based selection
  passwordInput: iosInputByIndex(1),
  confirmPasswordInput: iosInputByIndex(2),
  unlockPasswordInput: iosInputByIndex(1),
  unlockButton: iosButton('Unlock'),

  // Navigation buttons
  continueButton: iosButton('Continue'),
  backButton: iosButton('Back'),
  getStartedButton: iosButton('Get started'),

  // Explore page buttons - these are Link components with text in nested spans
  // Use iosText for more flexible matching since the text might be in a child element
  sendButton: iosText('Send'),
  receiveButton: iosText('Receive'),
  faucetButton: iosText('Faucet'),

  // Send flow
  sendFlow: iosText('Send'),
  recipientInput: iosInputByIndex(1),
  amountInput: iosInputByIndex(2),
  reviewButton: iosButton('Review'),
  confirmSendButton: iosButton('Confirm'),

  // Receive page
  receivePage: iosText('Receive'),
  addressDisplay: '//XCUIElementTypeStaticText[contains(@label, "0x")]',
  uploadButton: iosButton('Upload'),

  // Settings
  settingsTab: iosButton('Settings'),
  generalSettings: iosText('General'),
  advancedSettings: iosText('Advanced'),

  // DApp Browser
  browserTab: iosButton('Browser'),
  browserUrlInput: '//XCUIElementTypeTextField',
  browserGoButton: iosButton('Go'),

  // Common
  root: '#root',
  loadingSpinner: iosText('Loading'),
  errorMessage: '//XCUIElementTypeStaticText[contains(@label, "error") or contains(@label, "Error")]',
  successMessage: '//XCUIElementTypeStaticText[contains(@label, "success") or contains(@label, "Success")]',

  // DApp Browser - connection/transaction modals
  approveConnectionButton: iosButton('Approve'),
  rejectConnectionButton: iosButton('Reject'),
  confirmTransactionButton: iosButton('Confirm'),
  rejectTransactionButton: iosButton('Reject'),
  transactionConfirmationOverlay: iosText('Confirm Transaction'),
  copyAddressButton: iosButton('Copy'),
} as const;

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
  return `(//XCUIElementTypeTextField)[${index + 1}]`;
}

/**
 * Get a verify word button selector
 */
export function verifyWordSelector(word: string): string {
  return `//XCUIElementTypeButton[contains(@label, "${word}")]`;
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
