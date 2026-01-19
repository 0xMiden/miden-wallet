# Miden Wallet

A wallet for the Miden blockchain, available as a browser extension (Chrome, Firefox) and mobile app (iOS, Android).

<hr />

## ▶️ Install

You can install Miden Wallet right now: https://miden.fi/

## 🚀 Quick Start

Ensure you have:

- [Node.js](https://nodejs.org) 18 or later installed (Node 22+ required for mobile development)
- [Yarn](https://yarnpkg.com) v1 or v2 installed

Then run the following:

### 0) Rename .env.example to .env

```bash
mv ./.env.example ./.env
```

### 1) Clone the repository

```bash
git clone https://github.com/demox-labs/miden-wallet.git && cd miden-wallet
```

### 2) Install dependencies

```bash
yarn
```

### 3) Build

Builds the extension for production to the `dist` folder.<br>
It correctly bundles in production mode and optimizes the build for the best performance.

```bash
# for Chrome by default
yarn build
```

Optional for different browsers:

```bash
# for Chrome directly
yarn build:chrome
# for Firefox directly
yarn build:firefox
# for Opera directly
yarn build:opera

# for all at once
yarn build-all
```

## 🧱 Development

```bash
yarn dev
```

Runs the extension in the development mode for Chrome target.<br>
It's recommended to use Chrome for developing.

For testing with the Miden faucet, it is recommended to run a local faucet as we develop against their upcoming release branch. Refer to the [miden-node repo](https://github.com/0xPolygonMiden/miden-node/blob/next/bin/faucet/README.md) for setup.

## 📱 Mobile App

The mobile app uses [Capacitor](https://capacitorjs.com/) to wrap the React web app in native iOS and Android shells. It shares the same React codebase as the browser extension.

### Prerequisites

- **Node.js 22+** - Capacitor CLI requires Node >= 22. Use nvm to switch:
  ```bash
  source ~/.nvm/nvm.sh && nvm use 22
  ```
- **iOS**: Xcode with iOS development tools
- **Android**: Android Studio with Android SDK

### Development Scripts

```bash
# iOS
yarn mobile:ios           # Build, sync, and open in Xcode
yarn mobile:ios:run       # Build and run on iOS Simulator
yarn mobile:ios:build     # Build for iOS Simulator only

# Android
yarn mobile:android       # Build, sync, and open in Android Studio

# Build only (no IDE)
yarn build:mobile         # Production build for mobile
yarn build:mobile:dev     # Development build for mobile
yarn mobile:sync          # Build and sync with Capacitor
```

### Release Builds

```bash
# Android
yarn mobile:android:keystore     # Generate release keystore (one-time)
yarn mobile:android:release      # Build AAB for Play Store
yarn mobile:android:release:apk  # Build APK for direct distribution

# iOS
yarn mobile:ios:release          # Build release archive
yarn mobile:ios:export           # Export IPA for App Store
```

See `STORE_LISTING.md` for complete app store submission details.

### Key Differences from Browser Extension

| Aspect | Browser Extension | Mobile App |
|--------|------------------|------------|
| Backend | Service Worker | In-process (same thread) |
| Entry Point | `src/main.tsx` | `src/mobile-app.tsx` |
| Build Output | `dist/chrome_unpacked/` | `dist/mobile/` |
| Communication | Port messaging | Direct function calls |

### Mobile-Specific Features

- **Biometric Auth**: Face ID, Touch ID, Fingerprint
- **QR Code Scanning**: Native camera integration
- **Haptic Feedback**: Tactile responses for actions
- **In-App Browser**: For dApp interactions with secure webview

### Platform Detection

Use platform detection for mobile-specific code:

```typescript
import { isMobile, isIOS, isAndroid } from 'lib/platform';

if (isMobile()) {
  // Mobile-specific code
}
```

## Testing

```bash
yarn test
```

### Playwright (Mock WebClient)

The Playwright suite uses the SDK's `MockWebClient` to exercise wallet flows without hitting the network.

```bash
yarn playwright:install # first time to download the Chromium binary Playwright uses
yarn test:e2e
```

For UI tests we build the unpacked Chrome extension automatically if `dist/chrome_unpacked` is missing. Override the path with `EXTENSION_DIST=/path/to/unpacked` or skip building with `SKIP_EXTENSION_BUILD=true`.
