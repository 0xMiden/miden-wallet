import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.miden.wallet',
  appName: 'Miden Wallet',
  webDir: 'dist/mobile',
  server: {
    // Use HTTP to allow mixed content requests to Miden transport layer
    // Note: This is for development/testnet only. Production should use HTTPS throughout.
    androidScheme: 'http',
    cleartext: true
  },
  plugins: {
    Preferences: {
      // No special config needed
    }
  }
};

export default config;
