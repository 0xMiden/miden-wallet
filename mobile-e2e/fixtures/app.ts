/**
 * App fixtures for mobile e2e tests
 * Handles app launch, reset, and common setup operations
 */

import { Selectors, setWebViewContext } from '../helpers/selectors';

export const TEST_PASSWORD = 'Password123!';
export const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

/**
 * Get context id from a context (handles both string and object forms)
 */
function getContextId(ctx: unknown): string {
  if (typeof ctx === 'string') {
    return ctx;
  }
  if (ctx && typeof ctx === 'object' && 'id' in ctx) {
    return (ctx as { id: string }).id;
  }
  return '';
}

/**
 * Try to switch to WebView context if available
 * NOTE: Disabled for now - native context works better for element finding
 * Returns true if switched, false if staying in native context
 */
async function trySwitchToWebView(): Promise<boolean> {
  // Stay in native context - XPath selectors work better there
  // WebView context has issues with HTML element matching
  setWebViewContext(false);
  return false;
}

// Track if we've already dismissed the notification alert this session
let notificationAlertDismissed = false;

/**
 * Dismiss any iOS system alerts (notification permissions, etc.)
 */
async function dismissSystemAlerts(): Promise<void> {
  // Only check for notification alert once per session
  if (notificationAlertDismissed) {
    return;
  }

  // Try finding iOS permission buttons directly (avoids noisy warnings)
  try {
    const allowButton = await $('//XCUIElementTypeButton[@name="Allow"]');
    if (await allowButton.isExisting()) {
      await allowButton.click();
      await browser.pause(500);
      notificationAlertDismissed = true;
      return;
    }
  } catch {
    // No Allow button
  }

  try {
    const dontAllowButton = await $('//XCUIElementTypeButton[@name="Don\'t Allow"]');
    if (await dontAllowButton.isExisting()) {
      await dontAllowButton.click();
      await browser.pause(500);
      notificationAlertDismissed = true;
    }
  } catch {
    // No Don't Allow button
  }
}

/**
 * Reset the alert dismissed flag (call at start of each test)
 */
export function resetAlertState(): void {
  notificationAlertDismissed = false;
}

/**
 * Wait for the app to be ready (past splash screen)
 * Uses XPath selectors that work in native iOS/Android context
 */
export async function waitForAppReady(): Promise<void> {
  // Try to switch to WebView context (optional, works without it)
  await trySwitchToWebView();

  // Wait for app to show welcome screen or main screen
  // Using XPath that works in native context
  const startTime = Date.now();
  const timeout = 30000;

  while (Date.now() - startTime < timeout) {
    // Check for and dismiss any system alerts (notification permissions, etc.)
    await dismissSystemAlerts();

    try {
      // Try to find various screens that indicate the app is ready:
      // 1. Welcome screen (new wallet) - "Create a new wallet" button
      // 2. Main screen (unlocked wallet) - "Send" button or similar
      // 3. Lock screen (locked wallet) - "Unlock" button
      const welcomeSelector = Selectors.createWalletButton;
      const mainSelector = Selectors.sendButton;
      const unlockSelector = Selectors.unlockButton;

      const welcomeElement = await $(welcomeSelector);
      const mainElement = await $(mainSelector);
      const unlockElement = await $(unlockSelector);

      const welcomeExists = await welcomeElement.isExisting().catch(() => false);
      const mainExists = await mainElement.isExisting().catch(() => false);
      const unlockExists = await unlockElement.isExisting().catch(() => false);

      if (welcomeExists || mainExists || unlockExists) {
        return;
      }
    } catch {
      // Elements not found yet, keep waiting
    }
    await browser.pause(500);
  }

  throw new Error('App did not load within timeout');
}

/**
 * Reset app state by clearing storage
 * Note: This uses Appium's reset capabilities
 */
export async function resetAppState(): Promise<void> {
  // Try to clear app data/storage (removes wallet state)
  try {
    // On iOS, we need to remove the app and reinstall to clear data
    // But for faster tests, we just terminate and relaunch
    // The app should start fresh if no wallet exists
    await driver.terminateApp('com.miden.wallet');
  } catch {
    // App might not be running
  }

  await browser.pause(500);
  await driver.activateApp('com.miden.wallet');
  await waitForAppReady();
}

/**
 * Check if we're on the onboarding screen
 */
export async function isOnOnboarding(): Promise<boolean> {
  try {
    const welcome = await $(Selectors.createWalletButton);
    return await welcome.isDisplayed();
  } catch {
    return false;
  }
}

/**
 * Check if wallet is unlocked and ready
 */
export async function isWalletReady(): Promise<boolean> {
  try {
    // Check for explore page elements (Send button)
    const sendButton = await $(Selectors.sendButton);
    return await sendButton.isDisplayed();
  } catch {
    return false;
  }
}

/**
 * Trigger biometric authentication on iOS Simulator
 */
export async function triggerFaceIdMatch(): Promise<void> {
  if (driver.isIOS) {
    await driver.execute('mobile: enrollBiometric', { isEnabled: true });
    await driver.execute('mobile: sendBiometricMatch', { type: 'faceId', match: true });
  }
}

/**
 * Trigger biometric authentication on Android Emulator
 */
export async function triggerFingerprintMatch(): Promise<void> {
  if (driver.isAndroid) {
    // Android emulator fingerprint touch
    await driver.fingerPrint(1);
  }
}

/**
 * Platform-agnostic biometric trigger
 */
export async function triggerBiometricMatch(): Promise<void> {
  if (driver.isIOS) {
    await triggerFaceIdMatch();
  } else {
    await triggerFingerprintMatch();
  }
}

/**
 * Take a screenshot and save it
 */
export async function takeScreenshot(name: string): Promise<string> {
  const timestamp = Date.now();
  const filename = `${name}_${timestamp}.png`;
  await browser.saveScreenshot(`./mobile-e2e/screenshots/${filename}`);
  return filename;
}
