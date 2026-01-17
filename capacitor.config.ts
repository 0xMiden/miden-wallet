import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.miden.wallet',
  appName: 'Miden Wallet',
  webDir: 'dist/mobile',
  server: {
    // Use HTTP scheme on both platforms to allow network requests from WASM workers
    // Note: This is for development/testnet only. Production should use HTTPS throughout.
    androidScheme: 'http',
    iosScheme: 'http',
    cleartext: true
  },
  plugins: {
    Preferences: {
      // No special config needed
    },
    Keyboard: {
      // Prevent keyboard from pushing content - overlay instead
      resize: 'none',
      // Show accessory bar (Done button) on iOS
      resizeOnFullScreen: true
    }
  }
};

export default config;
