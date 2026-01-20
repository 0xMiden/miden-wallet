import { config as sharedConfig } from './wdio.shared.conf';
import type { Options } from '@wdio/types';
import path from 'path';

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
          log: './mobile-e2e/logs/appium-ios.log',
        },
      },
    ],
  ],

  capabilities: [
    {
      platformName: 'iOS',
      'appium:deviceName': 'iPhone 17',
      'appium:platformVersion': '26.2',
      'appium:automationName': 'XCUITest',
      'appium:app': path.resolve(
        __dirname,
        '../ios/App/build-sim/Build/Products/Debug-iphonesimulator/App.app'
      ),
      'appium:noReset': false,
      'appium:fullReset': true,
      'appium:newCommandTimeout': 240,
      // WebView context settings
      'appium:webviewConnectTimeout': 30000,
      'appium:includeSafariInWebviews': true,
      'appium:webviewConnectRetries': 10,
      'appium:fullContextList': true,
      // Enable native web tap to interact with WebView elements
      'appium:nativeWebTap': true,
      // Use Safari Web Inspector protocol
      'appium:safariAllowPopups': true,
    },
  ],

  // iOS-specific hooks
  before: async () => {
    // Enable FaceID enrollment on simulator
    await browser.execute('mobile: enrollBiometric', { isEnabled: true });
  },
} as Options.Testrunner;
