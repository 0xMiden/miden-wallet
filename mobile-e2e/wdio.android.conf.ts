import { config as sharedConfig } from './wdio.shared.conf';
import type { Options } from '@wdio/types';
import path from 'path';
import os from 'os';
import fs from 'fs';

// Set ANDROID_HOME if not already set
if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
  const macOsPath = path.join(os.homedir(), 'Library/Android/sdk');
  const linuxCiPath = '/usr/local/lib/android/sdk';

  if (fs.existsSync(macOsPath)) {
    process.env.ANDROID_HOME = macOsPath;
  } else if (fs.existsSync(linuxCiPath)) {
    process.env.ANDROID_HOME = linuxCiPath;
  }
  process.env.ANDROID_SDK_ROOT = process.env.ANDROID_HOME;
}

// Set JAVA_HOME if not already set
if (!process.env.JAVA_HOME) {
  const androidStudioJdk = '/Applications/Android Studio.app/Contents/jbr/Contents/Home';
  if (fs.existsSync(androidStudioJdk)) {
    process.env.JAVA_HOME = androidStudioJdk;
    process.env.PATH = `${androidStudioJdk}/bin:${process.env.PATH}`;
  }
  // GitHub Actions sets JAVA_HOME automatically
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

  services: [
    [
      'appium',
      {
        args: {
          relaxedSecurity: true,
          log: './mobile-e2e/logs/appium-android.log'
        }
      }
    ]
  ],

  capabilities: [
    {
      platformName: 'Android',
      // Device name varies by environment - let Appium auto-detect
      'appium:deviceName': 'Android Emulator',
      // CI uses API 31 (Android 12), local dev may vary - use 12 for CI compatibility
      'appium:platformVersion': '12',
      'appium:automationName': 'UiAutomator2',
      'appium:app': path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk'),
      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:newCommandTimeout': 240,
      'appium:autoGrantPermissions': true,
      // UiAutomator2 stability settings
      'appium:uiautomator2ServerLaunchTimeout': 60000,
      'appium:uiautomator2ServerInstallTimeout': 60000,
      'appium:skipUnlock': true,
      'appium:disableWindowAnimation': true,
      // WebView context settings
      'appium:webviewConnectTimeout': 30000,
      'appium:fullContextList': true,
      // Enable Chrome debugging for WebView
      'appium:chromeOptions': {
        w3c: true
      },
      // Native web tap for WebView elements
      'appium:nativeWebTap': true
    }
  ],

  // Android-specific hooks
  before: async () => {
    // Android-specific setup
  }
} as Options.Testrunner;
