import { config as sharedConfig } from './wdio.shared.conf';
import type { Options } from '@wdio/types';
import path from 'path';

export const config: Options.Testrunner = {
  ...sharedConfig,

  services: [
    [
      'appium',
      {
        args: {
          relaxedSecurity: true,
          log: './mobile-e2e/logs/appium-android.log',
        },
      },
    ],
  ],

  capabilities: [
    {
      platformName: 'Android',
      'appium:deviceName': 'Pixel 8',
      'appium:platformVersion': '14',
      'appium:automationName': 'UiAutomator2',
      'appium:app': path.resolve(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk'),
      'appium:noReset': false,
      'appium:fullReset': false,
      'appium:newCommandTimeout': 240,
      'appium:autoGrantPermissions': true,
      // WebView context settings
      'appium:webviewConnectTimeout': 30000,
      'appium:fullContextList': true,
      // Enable Chrome debugging for WebView
      'appium:chromeOptions': {
        w3c: true,
      },
      // Native web tap for WebView elements
      'appium:nativeWebTap': true,
    },
  ],

  // Android-specific hooks
  before: async () => {
    // Android-specific setup
  },
} as Options.Testrunner;
