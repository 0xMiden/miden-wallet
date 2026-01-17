# App Store Listing Information

This document contains the metadata needed for App Store (iOS) and Google Play (Android) submissions.

---

## App Information

- **App Name:** Miden Wallet
- **Bundle ID / Package Name:** com.miden.wallet
- **Version:** 1.1.6
- **Category:** Finance
- **Content Rating:** Everyone / 4+

---

## Short Description (80 characters max)

```
Secure wallet for the Miden blockchain. Send, receive, and manage your assets.
```

---

## Full Description

```
Miden Wallet is the official wallet for the Miden blockchain, designed to give you complete control over your digital assets with industry-leading security and privacy.

KEY FEATURES

Secure by Design
• Biometric authentication (Face ID / Fingerprint) for quick, secure access
• Your private keys never leave your device
• Password-protected wallet with encrypted local storage

Easy Asset Management
• Send and receive MIDEN tokens and other assets
• View your transaction history and account balances
• Automatic token claiming from faucets
• Support for multiple account types

Privacy-Focused
• Built on Miden's zero-knowledge proof technology
• Private transactions that protect your financial data
• No tracking or analytics that compromise your privacy

User-Friendly Experience
• Clean, intuitive interface
• Quick account setup with secure seed phrase backup
• Seamless switching between accounts
• Real-time balance updates

GETTING STARTED

1. Download and open Miden Wallet
2. Create a new wallet or import an existing one using your seed phrase
3. Secure your wallet with a password and enable biometric login
4. Start sending and receiving assets on the Miden network

SECURITY REMINDERS

• Always back up your seed phrase in a secure location
• Never share your seed phrase or private keys with anyone
• Enable biometric authentication for added security

Miden Wallet is open source. Visit our website to learn more about the Miden blockchain and our commitment to privacy and security.

Website: https://miden.fi
Privacy Policy: https://miden.fi/privacy
Terms of Service: https://miden.fi/terms
```

---

## Keywords (iOS - 100 characters max)

```
miden,wallet,crypto,blockchain,privacy,zero-knowledge,zk,defi,tokens,secure,finance
```

---

## What's New (Release Notes) - Version 1.1.6

```
• Improved auto-consume for faucet tokens
• Fixed activity list display on mobile devices
• Enhanced version display in Settings
• Performance improvements and bug fixes
```

---

## Screenshots Required

### iOS
- 6.7" Display (iPhone 14 Pro Max): 1290 x 2796 px
- 6.5" Display (iPhone 11 Pro Max): 1242 x 2688 px
- 5.5" Display (iPhone 8 Plus): 1242 x 2208 px
- 12.9" Display (iPad Pro): 2048 x 2732 px

### Android
- Phone: 1080 x 1920 px (minimum)
- 7" Tablet: 1200 x 1920 px
- 10" Tablet: 1800 x 2560 px

### Suggested Screenshot Scenes
1. Home screen with account balance
2. Send transaction screen
3. Receive screen with QR code
4. Activity/transaction history
5. Settings with biometric option
6. Account management

---

## App Icon

- iOS: 1024 x 1024 px (no transparency, no rounded corners)
- Android: 512 x 512 px

Current icons are located at:
- iOS: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- Android: `android/app/src/main/res/mipmap-*/`

---

## Privacy Policy & Support

- **Privacy Policy URL:** https://miden.fi/privacy
- **Terms of Service URL:** https://miden.fi/terms
- **Support URL:** https://miden.fi
- **Support Email:** (Add support email)

---

## App Review Information (iOS)

### Demo Account
If review requires a test account, provide:
- Instructions for creating a test wallet
- Note: App works offline for wallet creation, network connection needed for transactions

### Notes for Reviewers
```
Miden Wallet is a cryptocurrency wallet for the Miden blockchain.

To test the app:
1. Create a new wallet (no account needed)
2. Set a password and optionally enable Face ID
3. The app will generate a new account on the Miden testnet
4. You can request test tokens from the built-in faucet link

The app requires network connectivity to sync with the Miden blockchain for sending/receiving tokens, but wallet creation and account management work offline.
```

---

## Content Rating Questionnaire Notes

### iOS (App Store)
- No objectionable content
- No user-generated content sharing
- No gambling or contests
- Handles financial data (cryptocurrency)

### Android (Google Play)
- Target audience: General (Everyone)
- Contains: Financial features
- Does not contain: Violence, sexual content, gambling

---

## Data Safety (Google Play)

### Data Collected
- **Financial info:** Cryptocurrency wallet addresses and balances (stored locally only)

### Data NOT Collected
- Personal info (name, email, phone)
- Location
- App activity analytics
- Device identifiers for advertising

### Security Practices
- Data encrypted in transit (HTTPS)
- Data encrypted at rest (local encryption)
- Users can request data deletion (by removing the app/wallet)

---

## Release Build Commands

### Android

```bash
# 1. Generate release keystore (one-time)
yarn mobile:android:keystore

# 2. Create keystore.properties (copy from example and fill in)
cp android/keystore.properties.example android/keystore.properties
# Edit android/keystore.properties with your passwords

# 3. Build release AAB (for Play Store)
yarn mobile:android:release

# 4. Or build release APK (for direct distribution)
yarn mobile:android:release:apk
```

Output locations:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### iOS

```bash
# 1. Update ExportOptions.plist with your Team ID
# Edit ios/App/ExportOptions.plist

# 2. Build release archive
yarn mobile:ios:release

# 3. Export for App Store (requires valid signing)
yarn mobile:ios:export
```

Output locations:
- Archive: `ios/App/build/MidenWallet.xcarchive`
- Export: `ios/App/build/export/`

Alternatively, open Xcode and use Product > Archive for a GUI workflow.

---

## Checklist Before Submission

### iOS App Store
- [ ] Screenshots for all required device sizes
- [ ] App icon (1024x1024)
- [ ] App Store Connect account set up
- [ ] Distribution certificate and provisioning profile
- [ ] Privacy policy URL accessible
- [ ] Age rating questionnaire completed
- [ ] App Review notes prepared

### Google Play Store
- [ ] Screenshots for phone and tablet
- [ ] Feature graphic (1024x500)
- [ ] App icon (512x512)
- [ ] Google Play Console account set up
- [ ] Release keystore created and secured
- [ ] Privacy policy URL accessible
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed
