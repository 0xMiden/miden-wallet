import { config as sharedConfig } from './wdio.shared.conf';
import type { Options } from '@wdio/types';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Clear iOS app data using simctl commands (much faster than fullReset)
 * This clears IndexedDB, Preferences, Caches without reinstalling the app
 */
function clearIOSAppData(): void {
  const bundleId = 'com.miden.wallet';

  try {
    // Get the app data container path
    const containerPath = execSync(`xcrun simctl get_app_container booted ${bundleId} data 2>/dev/null`, {
      encoding: 'utf-8'
    }).trim();

    if (containerPath) {
      // Clear WebKit data (IndexedDB)
      execSync(`rm -rf "${containerPath}/Library/WebKit"`, { encoding: 'utf-8' });
      // Clear Preferences (Capacitor Preferences/UserDefaults)
      execSync(`rm -rf "${containerPath}/Library/Preferences"`, { encoding: 'utf-8' });
      // Clear Caches
      execSync(`rm -rf "${containerPath}/Library/Caches"`, { encoding: 'utf-8' });
      // Clear Documents
      execSync(`rm -rf "${containerPath}/Documents"`, { encoding: 'utf-8' });
      // Clear localStorage/sessionStorage (kvstore)
      execSync(`rm -rf "${containerPath}/Library/kvstore"`, { encoding: 'utf-8' });
      console.log('[iOS] Cleared app data via simctl');
    }
  } catch {
    // App might not be installed yet on first run
    console.log('[iOS] Could not clear app data (app may not be installed yet)');
  }
}

export const config: Options.Testrunner = {
  ...sharedConfig,

  // Fail fast - stop after first failure (for faster debugging)
  bail: 1,

  // Run onboarding tests, then wallet feature tests
  specs: [
    './tests/onboarding/import-wallet.spec.ts',
    './tests/onboarding/create-wallet.spec.ts',
    './tests/onboarding/seed-validation.spec.ts',
    './tests/wallet/send.spec.ts',
    './tests/wallet/receive.spec.ts'
  ],

  // Run tests sequentially (one at a time) - crucial for mobile where only one simulator can run
  maxInstances: 1,
  maxInstancesPerCapability: 1,

  services: [
    [
      'appium',
      {
        args: {
          relaxedSecurity: true,
          log: './mobile-e2e/logs/appium-ios.log'
        }
      }
    ]
  ],

  capabilities: [
    {
      platformName: 'iOS',
      'appium:deviceName': 'iPhone 17',
      'appium:platformVersion': '26.2',
      'appium:automationName': 'XCUITest',
      'appium:app': path.resolve(__dirname, '../ios/App/build-sim/Build/Products/Debug-iphonesimulator/App.app'),
      'appium:noReset': false,
      'appium:fullReset': false, // Fast reset via simctl clears app data without reinstalling
      'appium:newCommandTimeout': 240,
      // WebView context settings
      'appium:webviewConnectTimeout': 30000,
      'appium:includeSafariInWebviews': true,
      'appium:webviewConnectRetries': 10,
      'appium:fullContextList': true,
      // Enable native web tap to interact with WebView elements
      'appium:nativeWebTap': true,
      // Use Safari Web Inspector protocol
      'appium:safariAllowPopups': true
    }
  ],

  // iOS-specific hooks
  before: async () => {
    // Clear app data at start of each test file (fast alternative to fullReset)
    clearIOSAppData();

    // Terminate and relaunch app to pick up cleared state
    try {
      await driver.terminateApp('com.miden.wallet');
    } catch {
      // App might not be running
    }
    await driver.pause(300);
    await driver.activateApp('com.miden.wallet');

    // Enable FaceID enrollment on simulator
    await browser.execute('mobile: enrollBiometric', { isEnabled: true });
  }
} as Options.Testrunner;
