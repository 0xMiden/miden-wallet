/**
 * App fixtures for mobile e2e tests
 * Handles app launch, reset, and common setup operations
 */

import { execSync } from 'child_process';
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

/**
 * Dismiss any iOS system alerts (notification permissions, etc.)
 * This can be called multiple times as alerts may appear at different points in the flow
 */
export async function dismissSystemAlerts(): Promise<void> {
  // Only check on iOS
  if (!driver.isIOS) {
    return;
  }

  // Brief pause to let alert appear
  await browser.pause(300);

  // Try Appium's native alert handling first
  try {
    const alertText = await driver.getAlertText();
    if (alertText) {
      console.log('[dismissSystemAlerts] Found alert:', alertText);
      // Dismiss the alert (clicks the default/cancel button)
      await driver.dismissAlert();
      await browser.pause(300);
      return;
    }
  } catch {
    // No alert present via native API
  }

  // Fallback: Try to find and click alert buttons directly
  try {
    // Look for any alert button
    const alertButtons = await $$('//XCUIElementTypeAlert//XCUIElementTypeButton');
    if (alertButtons.length > 0) {
      // Click the first button (usually "Don't Allow" or cancel)
      console.log('[dismissSystemAlerts] Found alert buttons, clicking first one');
      await alertButtons[0].click();
      await browser.pause(300);
      return;
    }
  } catch {
    // No alert buttons found
  }
}


/**
 * Wait for the app to be ready (past splash screen)
 * Uses XPath selectors that work in native iOS/Android context
 */
export async function waitForAppReady(): Promise<void> {
  // Try to switch to WebView context (optional, works without it)
  await trySwitchToWebView();

  // Dismiss system alerts once at start (not every poll iteration)
  await dismissSystemAlerts();

  // Wait for app to show welcome screen or main screen
  // Using XPath that works in native context
  const startTime = Date.now();
  const timeout = 30000;
  let pollInterval = 100; // Start with 100ms, use exponential backoff

  while (Date.now() - startTime < timeout) {
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
    await browser.pause(pollInterval);
    // Exponential backoff: 100ms -> 200ms -> 400ms, capped at 500ms
    pollInterval = Math.min(pollInterval * 2, 500);
  }

  throw new Error('App did not load within timeout');
}

/**
 * Clear iOS app data using simctl commands (much faster than fullReset)
 * This clears IndexedDB, Preferences, Caches without reinstalling the app
 */
async function clearIOSAppData(): Promise<void> {
  const bundleId = 'com.miden.wallet';

  try {
    // Get the app data container path
    const containerPath = execSync(`xcrun simctl get_app_container booted ${bundleId} data`, {
      encoding: 'utf-8'
    }).trim();

    if (containerPath) {
      // Clear WebKit data (IndexedDB, LocalStorage)
      execSync(`rm -rf "${containerPath}/Library/WebKit"`, { encoding: 'utf-8' });
      // Clear Preferences (Capacitor Preferences/UserDefaults)
      execSync(`rm -rf "${containerPath}/Library/Preferences"`, { encoding: 'utf-8' });
      // Clear Caches
      execSync(`rm -rf "${containerPath}/Library/Caches"`, { encoding: 'utf-8' });
      // Clear Documents
      execSync(`rm -rf "${containerPath}/Documents"`, { encoding: 'utf-8' });
      // Clear localStorage/sessionStorage (kvstore)
      execSync(`rm -rf "${containerPath}/Library/kvstore"`, { encoding: 'utf-8' });
      // Clear Cookies
      execSync(`rm -rf "${containerPath}/Library/Cookies"`, { encoding: 'utf-8' });
      // Clear Saved Application State (prevents state restoration)
      execSync(`rm -rf "${containerPath}/Library/Saved Application State"`, { encoding: 'utf-8' });
      // Also clear tmp directory
      execSync(`rm -rf "${containerPath}/tmp"/*`, { encoding: 'utf-8' });
      console.log('[iOS resetAppState] Cleared app data via simctl');
    }
  } catch (e) {
    console.warn('[clearIOSAppData] Failed to clear app data:', e);
  }
}

/**
 * Reset app state by clearing storage
 * For iOS: Uses simctl to clear app data directories (fast, no reinstall)
 * For Android: Just terminates and relaunches (fullReset: false handles data clearing)
 */
export async function resetAppState(): Promise<void> {
  // Terminate the app first
  try {
    await driver.terminateApp('com.miden.wallet');
  } catch {
    // App might not be running
  }

  // On iOS, clear app data using simctl (fast alternative to fullReset)
  if (driver.isIOS) {
    await clearIOSAppData();
  }

  await browser.pause(300);
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
