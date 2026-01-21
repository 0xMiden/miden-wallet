# CLAUDE.md

This file provides guidance for Claude Code when working on this repository.

**Self-maintaining document:** Proactively update this file when you learn something worth remembering - new patterns, gotchas, debugging techniques, or project-specific knowledge. Don't wait to be asked.

## Project Overview

Miden Wallet is a browser extension wallet for the Miden blockchain, also available as a mobile app for iOS and Android. The browser version is built as a Chrome/Firefox extension with a React frontend and a service worker backend. The mobile app uses Capacitor to wrap the web app in a native shell.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Extension                     │
├─────────────────────────┬───────────────────────────────┤
│   Frontend (Popup/Tab)  │   Backend (Service Worker)    │
│                         │                               │
│   React + Zustand       │   Effector Store              │
│   - UI Components       │   - Vault (secure storage)    │
│   - State management    │   - Wallet operations         │
│                         │                               │
│         ◄──── Intercom (Port messaging) ────►           │
└─────────────────────────┴───────────────────────────────┘
```

**Key principle:** Backend is the source of truth. Frontend syncs via intercom messaging.

## Key Directories

```
src/
├── lib/
│   ├── store/           # Zustand store (frontend state)
│   ├── miden/
│   │   ├── back/        # Backend: Effector store, vault, actions
│   │   ├── front/       # Frontend: hooks, providers, client
│   │   └── sdk/         # Miden SDK integration
│   ├── intercom/        # Port-based messaging between frontend/backend
│   └── shared/types.ts  # Shared type definitions
├── app/                 # React app entry, pages, templates
├── screens/             # Screen components (onboarding, send, etc.)
└── workers/             # Background service worker entry
```

## Key Modules

Quick reference for commonly needed utilities:

| Module | Path | Exports |
|--------|------|---------|
| Platform detection | `lib/platform` | `isMobile()`, `isIOS()`, `isAndroid()`, `isExtension()` |
| Haptic feedback | `lib/mobile/haptics` | `hapticLight()`, `hapticMedium()`, `hapticSelection()` |
| Mobile back handler | `lib/mobile/back-handler` | `initMobileBackHandler()`, `useMobileBackHandler()` |
| Navigation (Woozie) | `lib/woozie` | `navigate()`, `goBack()`, `useLocation()`, `<Link>` |
| App environment | `app/env` | `useAppEnv()`, `registerBackHandler()`, `onBack()` |

## Commands

```bash
yarn install          # Install dependencies
yarn build            # Build extension (outputs to dist/)
yarn dev              # Development build with watch
yarn test             # Run Jest tests
yarn lint             # ESLint
yarn format           # Prettier
```

**IMPORTANT:** Always run `yarn lint` and `yarn format` before `yarn build`. The build will fail on lint/prettier errors.

## Mobile Development

**IMPORTANT:** Always use these yarn scripts for mobile development. Do not run Capacitor or Xcode commands directly.

**IMPORTANT:** When testing mobile changes, always build and run the simulator yourself. Never tell the user to build/test changes themselves - do it for them.

**iOS Simulator:** Always use **iPhone 17** as the default simulator for testing.

**Node version:** Capacitor CLI requires Node >= 22. Use nvm to switch:
```bash
source ~/.nvm/nvm.sh && nvm use 22 && yarn mobile:ios:run
# or for Android:
source ~/.nvm/nvm.sh && nvm use 22 && yarn mobile:android
```

### iOS

```bash
yarn mobile:ios           # Build, sync, and open in Xcode
yarn mobile:ios:run       # Build and run on iOS Simulator (includes FaceID setup)
yarn mobile:ios:build     # Build for iOS Simulator only
yarn mobile:ios:faceid    # Fix FaceID enrollment on simulator
```

### Android

```bash
yarn mobile:android              # Build, sync, and open in Android Studio
yarn mobile:android:fingerprint  # Trigger fingerprint auth on emulator
```

### Build Only

```bash
yarn build:mobile         # Production build for mobile (outputs to dist/mobile/)
yarn build:mobile:dev     # Development build for mobile
yarn mobile:sync          # Build and sync with Capacitor (no IDE open)
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

See `STORE_LISTING.md` for full app store submission checklist and instructions.

### Workflow

1. Make code changes in `src/`
2. Run `yarn mobile:ios:run` to build and test on iOS Simulator
3. Or run `yarn mobile:ios` to open in Xcode for debugging

The mobile app shares the same React codebase as the browser extension. Mobile-specific code uses `isMobile()` checks from `lib/platform`.

### Platform-Specific Changes

**CRITICAL:** This app builds for three platforms: Chrome extension, iOS, and Android. When fixing bugs or adding features:

1. **Isolate platform-specific fixes** - If a bug only affects iOS, wrap the fix with platform detection (e.g., `if (isIOS()) { ... }`). Don't apply iOS fixes globally unless they genuinely apply to all platforms.
2. **Test across platforms** - Changes to shared code can break other platforms unexpectedly.
3. **Use platform detection** - `isMobile()`, `isIOS()`, `isAndroid()` from `lib/platform` for conditional logic.

### Haptic Feedback

**IMPORTANT:** When adding new tappable components (buttons, links, toggles, list items, etc.), always add haptic feedback for mobile users.

```typescript
import { hapticLight, hapticMedium, hapticSelection } from 'lib/mobile/haptics';

// Use hapticLight() for button taps, navigation links, card clicks
// Use hapticMedium() for toggles, checkboxes, radio buttons
// Use hapticSelection() for tab changes, footer navigation
```

The haptic functions automatically check `isMobile()` and the user's haptic feedback setting - no need to wrap in conditionals.

Components that already have haptics (for reference):
- `components/Button.tsx`, `app/atoms/Button.tsx` - buttons
- `lib/woozie/Link.tsx` - navigation links
- `components/Toggle.tsx`, `app/atoms/ToggleSwitch.tsx` - toggles
- `components/TabBar.tsx`, `app/atoms/TabSwitcher.tsx` - tabs
- `components/FooterIconWrapper.tsx` - footer navigation
- `components/CardItem.tsx`, `components/ListItem.tsx` - tappable items
- `components/Chip.tsx`, `components/CircleButton.tsx` - misc buttons
- `app/atoms/Checkbox.tsx`, `components/RadioButton.tsx` - form controls

### Known iOS-Specific Issues

- **WASM/WebWorker behavior** - iOS Safari has different WebWorker/WASM memory handling than Android/Chrome
- **IndexedDB quirks** - Safari's IndexedDB implementation has known limitations (e.g., doesn't work in private browsing, stricter storage quotas)
- **Memory pressure** - iOS is more aggressive about limiting memory; watch for OOM issues with multiple WASM worker instances

### File Downloads on Mobile

**The standard web download approach does NOT work on mobile:**
```typescript
// This works on desktop but NOT on iOS/Android WebView
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'file.json';
a.click();  // Does nothing on mobile!
```

**Use Capacitor Filesystem + Share plugins instead:**
```typescript
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isMobile } from 'lib/platform';

if (isMobile()) {
  // Write to cache, then share
  const result = await Filesystem.writeFile({
    path: 'file.json',
    data: fileContent,
    directory: Directory.Cache,
    encoding: Encoding.UTF8
  });
  await Share.share({ url: result.uri });
} else {
  // Standard web download for desktop
}
```

### Adding/Removing Capacitor Plugins

When **adding** new Capacitor plugins:

1. Install: `yarn add @capacitor/plugin-name`
2. Sync: `yarn mobile:sync` (updates iOS and Android native projects)
3. **Add ProGuard rules** for Android release builds in `android/app/proguard-rules.pro`:
   ```
   -keep class com.capacitorjs.plugins.pluginname.** { *; }
   ```
4. Check if iOS needs Info.plist permissions (most plugins document this)

When **removing** Capacitor plugins:

1. Uninstall: `yarn remove @capacitor/plugin-name`
2. Sync: `yarn mobile:sync` (updates iOS and Android native projects)
3. **Remove ProGuard rules** from `android/app/proguard-rules.pro` for the removed plugin

### Debugging iOS Issues

**Debug UI components:** When adding debug panels to the UI, ensure all text is **selectable** (use `select-text` or `user-select: text`) so the user can copy/paste error messages instead of retyping them.

**IMPORTANT:** Do NOT use `console.log` for iOS debugging - those logs go to Safari Web Inspector which Claude Code cannot access.

**Instead, use native iOS logging that can be read via CLI:**
```bash
# Stream logs from running simulator (filter for webkit/app logs)
xcrun simctl spawn booted log stream --predicate 'process == "App"' --level debug

# Or capture to file for later analysis
xcrun simctl spawn booted log stream --predicate 'process == "App"' > ios_logs.txt &
```

**For JavaScript code, use Capacitor's native logging or write to a debug file** that can be read from the simulator's file system.

**Alternative: Safari Web Inspector (manual, last resort):**
1. Run the app in simulator: `yarn mobile:ios:run`
2. Open Safari on Mac → Develop menu → Simulator → select the app
3. Console tab shows JavaScript logs

### Verifying Mobile UI Fixes

**IMPORTANT:** When fixing mobile UI issues (layout, spacing, safe areas, etc.), always verify the fix by taking screenshots from the simulator and analyzing them visually. Do not rely solely on code inspection.

**Workflow for UI fixes:**
1. Build and run on simulator: `yarn mobile:ios:run`
2. Take a screenshot: `xcrun simctl io booted screenshot /tmp/screenshot.png`
3. Read the screenshot file to visually verify the fix
4. If authentication is needed, trigger FaceID: `xcrun simctl spawn booted notifyutil -p com.apple.BiometricKit_Sim.fingerTouch.match`
5. Wait briefly and take another screenshot: `sleep 2 && xcrun simctl io booted screenshot /tmp/screenshot2.png`

**Example verification flow:**
```bash
# Build and launch
source ~/.nvm/nvm.sh && nvm use 22 && yarn mobile:ios:run

# Take screenshot after app loads
xcrun simctl io booted screenshot /tmp/ios-test.png

# Authenticate if needed (for locked wallet)
xcrun simctl spawn booted notifyutil -p com.apple.BiometricKit_Sim.fingerTouch.match

# Wait and capture main screen
sleep 2 && xcrun simctl io booted screenshot /tmp/ios-main.png
```

**Common iOS layout issues and fixes:**
- **Grey bar at bottom:** Usually caused by `100dvh` height not accounting for safe areas. Use `100%` instead and ensure `mobile.html` body has proper safe area padding.
- **Content cut off:** Check if containers have `overflow: hidden` without proper height constraints.
- **Safe area gaps:** Ensure `public/mobile.html` has `padding: env(safe-area-inset-*)` on body, and body background color matches app background (white).

## Code Style (Prettier)

This project uses Prettier for code formatting. Always write code that conforms to Prettier rules:

- **Line length:** Max 120 characters. Break long lines, especially `console.log` statements with multiple arguments
- **Multi-argument calls:** When function calls exceed line length, put each argument on its own line:
  ```typescript
  // Good
  console.log(
    '[Component] message:',
    value1,
    'key2:',
    value2
  );

  // Bad - will fail prettier
  console.log('[Component] message:', value1, 'key2:', value2, 'key3:', value3);
  ```
- **Trailing commas:** Use trailing commas in multi-line arrays/objects
- **Semicolons:** Always use semicolons
- **Quotes:** Single quotes for strings

Run `yarn format` to auto-fix formatting issues if needed.

## State Management

- **Backend:** Effector store in `src/lib/miden/back/store.ts`
- **Frontend:** Zustand store in `src/lib/store/index.ts`
- **Sync:** `WalletStoreProvider` subscribes to `StateUpdated` broadcasts

Frontend hooks that use Zustand:
- `useMidenContext()` - main wallet state and actions
- `useAllBalances()` - token balances with polling
- `useAllTokensBaseMetadata()` - asset metadata cache

## Intercom Messaging

Frontend ↔ Backend communication uses `IntercomClient`/`IntercomServer`:

```typescript
// Frontend request
const res = await intercom.request({ type: WalletMessageType.EditAccountRequest, ... });

// Backend broadcasts state changes
intercom.broadcast({ type: WalletMessageType.StateUpdated });
```

Message types defined in `src/lib/shared/types.ts`.

## Navigation Architecture

**IMPORTANT - Maintain this section:** When adding new screens, routes, or modifying navigation flows, update the route maps and flow documentation below. This ensures mobile back button handling stays correct and future developers understand the navigation structure.

The app uses **two separate navigation systems**:

### 1. Woozie (Global Page Navigation)

Custom lightweight router in `src/lib/woozie/`. Uses History API with hash-based URLs (`USE_LOCATION_HASH_AS_URL = true`).

**Key exports:**
- `navigate(path)` - Navigate to a route
- `goBack()` - Go back in history (`window.history.go(-1)`)
- `useLocation()` - Get current `pathname`, `historyPosition`, etc.
- `<Link to="/path">` - Declarative navigation with haptic feedback

**History tracking:**
- `historyPosition` tracks position in navigation stack (0 = first page in session)
- Used to determine if back navigation is available

### 2. Navigator (Internal Step Navigation)

Component-based navigator in `src/components/Navigator.tsx` for multi-step flows.

**Used by:**
- `SendManager` (`src/screens/send-flow/SendManager.tsx`)
- `EncryptedFileManager` (`src/screens/encrypted-file-flow/EncryptedFileManager.tsx`)

**Key exports:**
- `useNavigator()` - Returns `{ navigateTo, goBack, cardStack, activeRoute }`
- `cardStack` - Array of visited routes (step history)
- `goBack()` - Pops from cardStack (only works if `cardStack.length > 1`)

### Route Map

**Tab Pages** (with persistent footer, via `TabLayout`):
| Route | Component | Back Behavior |
|-------|-----------|---------------|
| `/` | Explore (Home) | Minimize app (Android) / Nothing (iOS) |
| `/history/:programId?` | AllHistory | → Home |
| `/settings/:tabSlug?` | Settings | Sub-tab → Settings main → Home |
| `/browser` | Browser | → Home |

**Settings Sub-Tabs** (`/settings/:tabSlug`):
| Tab Slug | Component | Notes |
|----------|-----------|-------|
| `general-settings` | GeneralSettings | Theme, analytics, haptics |
| `language` | LanguageSettings | App language selection |
| `address-book` | AddressBook | Saved contacts |
| `reveal-seed-phrase` | RevealSeedPhrase | Only shown for non-public accounts |
| `edit-miden-faucet-id` | EditMidenFaucetId | Hidden from menu |
| `encrypted-wallet-file` | EncryptedFileFlow | Opens as full dialog (see flow below) |
| `advanced-settings` | AdvancedSettings | Developer options |
| `dapps` | DAppSettings | Authorized dApps management |
| `about` | About | Version info, links |
| `networks` | NetworksSettings | Hidden from menu |

**Full-Screen Pages** (slide animation, via `FullScreenPage` or `PageLayout`):
| Route | Component | Back Behavior |
|-------|-----------|---------------|
| `/send` | SendFlow | See Send Flow below |
| `/receive` | Receive | → Home |
| `/faucet` | Faucet | → Home |
| `/get-tokens` | GetTokens | → Home |
| `/select-account` | SelectAccount | → Home |
| `/create-account` | CreateAccount | → Previous |
| `/edit-name` | EditAccountName | → Previous |
| `/import-account/:tabSlug?` | ImportAccount | → Previous |
| `/history-details/:transactionId` | HistoryDetails | → History |
| `/token-history/:tokenId` | TokenHistory | → Home |
| `/manage-assets/:assetType?` | ManageAssets | → Home |
| `/encrypted-wallet-file` | EncryptedFileFlow | See Encrypted Flow below |
| `/generating-transaction` | GeneratingTransaction | (Modal - no back) |
| `/consuming-note/:noteId` | ConsumingNote | (Processing - no back) |
| `/import-note-pending/:noteId` | ImportNotePending | → Home |
| `/import-note-success` | ImportNoteSuccess | → Home |
| `/import-note-failure` | ImportNoteFailure | → Home |

**Onboarding/Auth Routes** (catch-all when locked):
- `/reset-required`, `/reset-wallet`, `/forgot-password`, `/forgot-password-info`

### Send Flow Steps (Internal Navigator)

Route: `/send` → `SendManager` with internal step navigation:

| Step | Component | Back Behavior |
|------|-----------|---------------|
| 1. SelectToken | Token picker | → Close flow (Home) |
| 2. SelectRecipient | Address input | → SelectToken |
| 3. AccountsList | Modal overlay | → Dismiss (stays on SelectRecipient) |
| 4. SelectAmount | Amount input | → SelectRecipient |
| 5. ReviewTransaction | Confirm details | → SelectAmount |
| 6. GeneratingTransaction | Processing | (No back) |
| 7. TransactionInitiated | Success | → Home |

### Encrypted File Flow Steps (Internal Navigator)

Route: `/encrypted-wallet-file` → `EncryptedFileManager`:

| Step | Component | Back Behavior |
|------|-----------|---------------|
| 1. CreatePassword | Password setup | → Close flow (Settings) |
| 2. ConfirmPassword | Confirm password | → CreatePassword |
| 3. ExportFile | Download file | → ConfirmPassword |

### Onboarding Flow (State-Based Navigation)

**IMPORTANT:** Unlike SendManager/EncryptedFileManager, the onboarding flow does NOT use the Navigator component. It uses hash-based URLs (`/#step-name`) with React state to track the current step.

Route: `/` (when wallet is locked/new) → `Welcome.tsx` with hash-based steps:

| Hash | Step | Back Behavior |
|------|------|---------------|
| (none) | Welcome | Minimize app (Android) / Nothing (iOS) |
| `#backup-seed-phrase` | BackupSeedPhrase | → Welcome |
| `#verify-seed-phrase` | VerifySeedPhrase | → BackupSeedPhrase |
| `#select-import-type` | SelectImportType | → Welcome |
| `#import-from-seed` | ImportFromSeed | → SelectImportType |
| `#import-from-file` | ImportFromFile | → SelectImportType |
| `#create-password` | CreatePassword | → Previous step (depends on flow) |
| `#confirmation` | Confirmation | (No back while loading) |

**Navigation pattern:**
- Steps navigate via `navigate('/#step-name')` which updates the URL hash
- `useEffect` watches the hash and updates `step` state accordingly
- Back navigation calls `onAction({ id: 'back' })` which has switch logic for each step
- Mobile back handler in `Welcome.tsx` triggers this same `onAction({ id: 'back' })`

**Forgot Password Flow** (`/forgot-password` → `ForgotPassword.tsx`) uses the same pattern with `ForgotPasswordStep` enum.

### Back Handler System

**Global handler** in `src/app/env.ts`:
- `registerBackHandler(handler)` - Register a back handler (returns unregister function)
- `onBack()` - Calls the current handler
- Stack-based: handlers can be layered (modals on top of pages)

**PageLayout** (`src/app/layouts/PageLayout.tsx`) registers default handler:
```typescript
// If history available, go back; otherwise go home
if (historyPosition > 0) {
  goBack();
} else if (!inHome) {
  navigate('/', HistoryAction.Replace);
}
```

### Mobile Back Button

**IMPORTANT:** Hardware back button on Android and swipe-back on iOS require `@capacitor/app` plugin and explicit handling. Without it, back gestures close the app instead of navigating.

Back handlers must be registered for:
1. Global navigation (MobileBackBridge component)
2. Navigator-based flows (SendManager, EncryptedFileManager)
3. State-based flows (Welcome/onboarding, ForgotPassword)
4. Modals/dialogs that should close on back

## Code Patterns

### Adding a new wallet action

1. Add message types to `src/lib/shared/types.ts`
2. Add handler in `src/lib/miden/back/actions.ts`
3. Register handler in `src/lib/miden/back/main.ts`
4. Add action to Zustand store in `src/lib/store/index.ts`
5. Expose via `useMidenContext()` in `src/lib/miden/front/client.ts`

### Optimistic updates

```typescript
// In store action
editSomething: async (id, value) => {
  const prev = get().items;
  set({ items: /* optimistic value */ });
  try {
    await request({ ... });
  } catch (error) {
    set({ items: prev }); // Rollback
    throw error;
  }
}
```

## Balance Loading Architecture

The wallet uses an IndexedDB-first pattern for instant UI updates:

```
┌─────────────────────────────────────────────────────────────┐
│                    Balance Loading Flow                      │
├─────────────────────────────────────────────────────────────┤
│  1. fetchBalances() → getAccount() → IndexedDB (instant)    │
│  2. AutoSync (1s interval) → syncState() → Miden Node       │
│  3. syncState updates IndexedDB → next fetchBalances sees it│
└─────────────────────────────────────────────────────────────┘
```

- `fetchBalances` in `src/lib/store/utils/fetchBalances.ts` reads from IndexedDB via `getAccount()` - it does NOT call `syncState()`
- `AutoSync` class in `src/lib/miden/front/sync.ts` handles background network sync separately
- This separation allows showing cached balances instantly while syncing in background

**Important distinction:**
- `getAccount(accountId)` - reads balance from IndexedDB (local cache)
- `syncState()` - syncs with Miden node and updates IndexedDB
- `importAccountById(assetId)` - imports **asset/token metadata**, not account balances

## WASM Client Concurrency

**CRITICAL:** The Miden WASM client cannot handle concurrent access. Concurrent calls cause:
```
Error: recursive use of an object detected which would lead to unsafe aliasing in rust
```

**Always wrap WASM client operations in `withWasmClientLock`:**

```typescript
import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';

// CORRECT - always use the lock
const result = await withWasmClientLock(async () => {
  const midenClient = await getMidenClient();
  return midenClient.someOperation();
});

// WRONG - direct access without lock causes concurrency errors
const midenClient = await getMidenClient();
const result = await midenClient.someOperation();
```

**This applies everywhere**, including:
- Transaction workers in `src/workers/` (consumeNoteId.ts, sendTransaction.ts, submitTransaction.ts)
- Backend operations in `src/lib/miden/back/`
- Frontend hooks in `src/lib/miden/front/`
- Any new code that accesses `getMidenClient()`

The lock ensures only one WASM operation runs at a time across the entire app, preventing AutoSync, dApp requests, and user operations from conflicting.

## Testing

- Unit tests in `*.test.ts` files alongside source
- Tests use Jest + React Testing Library
- Mock `lib/intercom` for frontend tests
- Wrap components with `WalletStoreProvider` + `MidenContextProvider`

### Jest Mock Gotchas

**Module path resolution:** Mock paths must match how the source file imports the module:
```typescript
// If actions.ts imports: import { Vault } from 'lib/miden/back/vault';
// Then mock with the same path:
jest.mock('lib/miden/back/vault', () => ({ ... }));
// NOT: jest.mock('./vault', ...) - this won't work
```

**jsdom limitations:** `window.location.reload` cannot be mocked in jsdom. Use try-catch:
```typescript
try {
  functionThatCallsReload();
} catch {
  // reload throws in jsdom, expected
}
```

**React test cleanup:** Prevent test pollution by cleaning up React roots:
```typescript
afterEach(() => {
  testRoot.unmount();
});
```

## CI/CD (GitHub Actions)

### Translations Job Ordering

**CRITICAL:** The `translations` job in `pr.yml` runs first and may commit updated translation files. This commit triggers GitHub's `cancel-in-progress` behavior, which would cancel any jobs that started before the commit.

**All other CI jobs must use `needs: translations`:**
```yaml
ios-e2e:
  name: iOS E2E Tests
  needs: translations  # REQUIRED - wait for translations to finish
  runs-on: macos-14
  # ...
```

**Why this matters:**
1. PR workflow has `concurrency: { cancel-in-progress: true }`
2. If translations job commits files while other jobs are running, those jobs get cancelled
3. Using `needs: translations` ensures jobs start only after any translation commits are done

**When adding new CI jobs to `pr.yml`:**
- Always add `needs: translations` to prevent cancellation
- Jobs can run in parallel with each other (e.g., `ios-e2e` and `android-e2e` both need `translations` but run concurrently)
- Only add dependencies between jobs if one truly requires another's output

**Workflow files:**
- `.github/workflows/pr.yml` - Main PR workflow (translations, ci, coverage, i18n-check, ios-e2e, android-e2e)
- `.github/workflows/mobile-e2e.yml` - Manual-only workflow for standalone mobile E2E runs

## Mobile E2E Testing

Mobile E2E tests use WebdriverIO + Appium to test the iOS and Android apps on simulators/emulators. Tests are located in `mobile-e2e/`.

### Directory Structure

```
mobile-e2e/
├── fixtures/           # Test setup helpers
│   ├── app.ts          # App launch, reset, system alerts
│   └── wallet.ts       # Wallet creation, import, unlock helpers
├── helpers/            # Utility functions
│   ├── selectors.ts    # Cross-platform element selectors
│   └── webview.ts      # WebView context switching, JS execution
├── tests/              # Test files organized by feature
│   ├── onboarding/     # Wallet creation/import tests
│   └── wallet/         # Send/receive tests
├── wdio.shared.conf.ts # Shared WebdriverIO config
├── wdio.ios.conf.ts    # iOS-specific config
└── wdio.android.conf.ts # Android-specific config
```

### Running Tests

```bash
yarn test:e2e:ios       # Run iOS tests (requires iOS Simulator)
yarn test:e2e:android   # Run Android tests (requires Android Emulator)
```

**Prerequisites:**
- iOS: Xcode with iOS Simulator, build with `yarn mobile:ios:build`
- Android: Android Emulator running, build APK with `cd android && ./gradlew assembleDebug`

### Architecture: Native Context vs WebView Context

This is the most important concept for mobile E2E testing. The app is a Capacitor WebView app, meaning:

- **Native Context (`NATIVE_APP`)**: Appium sees native iOS/Android element hierarchy. XPath selectors like `//XCUIElementTypeButton` work here. Text/labels are accessible via `@label` (iOS) or `@text` (Android).

- **WebView Context (`WEBVIEW_xxx`)**: Appium sees the actual HTML DOM. CSS selectors and DOM queries work here. Use `browser.execute()` to run JavaScript.

**Key insight**: Most element interactions work in **native context** using XPath selectors. Switch to WebView context only when you need to:
1. Execute JavaScript (set React input values, click inaccessible elements)
2. Query the DOM directly

```typescript
import { switchToNativeContext, switchToWebviewContext } from '../helpers/webview';

// Default: native context - use XPath selectors
const button = await $(Selectors.continueButton);
await button.click();

// Switch to WebView for JS execution
await switchToWebviewContext();
await browser.execute(() => {
  document.querySelector('input').value = 'test';
});
await switchToNativeContext();
```

### Key Helper Functions

#### Selectors (`helpers/selectors.ts`)

Platform-aware selectors that work in native context:

```typescript
import { Selectors, verifyWordSelector } from '../helpers/selectors';

// Pre-defined selectors (resolve at runtime based on platform)
await $(Selectors.createWalletButton);  // "Create a new wallet" button
await $(Selectors.sendButton);          // "Send" button on home
await $(Selectors.continueButton);      // "Continue" button

// Dynamic selectors
await $(verifyWordSelector('abandon')); // Word button during seed verification
```

**How selectors work:**
- iOS: `//XCUIElementTypeButton[@label="text"]` or `//XCUIElementTypeButton[contains(@label, "text")]`
- Android: `//*[@clickable="true" and contains(@text, "text")]`

#### WebView Helpers (`helpers/webview.ts`)

```typescript
import {
  switchToNativeContext,
  switchToWebviewContext,
  setPasswordInputs,
  setSeedPhraseInputs,
  disableBiometricsToggle,
  clickLinkViaJS,
  navigateToHomeViaJS
} from '../helpers/webview';

// Set password fields (triggers React onChange properly)
await setPasswordInputs('Password123!', 'Password123!');

// Set all 12 seed phrase inputs
await setSeedPhraseInputs(['abandon', 'abandon', ...]);

// Disable biometrics toggle to avoid Face ID prompt
await disableBiometricsToggle();

// Click link when native selector doesn't work (iOS accessibility issues)
await clickLinkViaJS('Send', '/send');

// Navigate home directly via JS (works around close button issues)
await navigateToHomeViaJS();
```

#### App Fixtures (`fixtures/app.ts`)

```typescript
import {
  resetAppState,
  waitForAppReady,
  dismissSystemAlerts,
  TEST_PASSWORD,
  TEST_MNEMONIC
} from '../fixtures/app';

// Reset app to fresh state (clears data without reinstalling)
await resetAppState();

// Wait for app to load past splash screen
await waitForAppReady();

// Dismiss iOS system alerts (notification permission, etc.)
await dismissSystemAlerts();
```

#### Wallet Fixtures (`fixtures/wallet.ts`)

```typescript
import {
  createNewWallet,
  importWalletFromSeed,
  unlockWallet,
  ensureWalletReady,
  getSeedWordsFromBackup
} from '../fixtures/wallet';

// Create new wallet with default password
await createNewWallet();

// Import wallet from seed phrase
await importWalletFromSeed(TEST_MNEMONIC, TEST_PASSWORD);

// Unlock existing wallet
await unlockWallet(TEST_PASSWORD);

// Get seed words shown on backup screen
const words = await getSeedWordsFromBackup();
```

### Common Pitfalls and Gotchas

#### 1. React Input Values Don't Trigger onChange

**Problem:** Native Appium `setValue()` doesn't trigger React's onChange handlers.

**Solution:** Use WebView JS helpers that dispatch proper events:
```typescript
// WRONG - value is set but React doesn't see it
const input = await $(Selectors.passwordInput);
await input.setValue('password');

// CORRECT - use WebView helper
await setPasswordInputs('password', 'password');
```

#### 2. iOS Elements with `accessible="false"`

**Problem:** Some React components (like `<Link>`) render with `accessible="false"`, making them invisible to native Appium selectors.

**Solution:** Use WebView JS click:
```typescript
// WRONG - element not found or not clickable
const sendLink = await $(Selectors.sendButton);
await sendLink.click();

// CORRECT for iOS - use JS click
await clickLinkViaJS('Send', '/send');
```

#### 3. Android aria-label Not Exposed

**Problem:** On Android WebView, `aria-label` attributes are NOT exposed to native accessibility hierarchy.

**Solution:** Use position-based selectors or visible text:
```typescript
// iOS: aria-label works
'//XCUIElementTypeButton[@label="Go back"]'

// Android: use position or visible text instead
'(//android.widget.Button[@text=""])[1]'  // First empty-text button
'//*[@clickable="true" and contains(@text, "Back")]'
```

#### 4. iOS System Alerts Block Tests

**Problem:** iOS shows notification permission dialogs that block test execution.

**Solution:** Dismiss alerts programmatically:
```typescript
// Call after actions that might trigger alerts
await createButton.click();
await dismissSystemAlerts();  // Handles "Allow Notifications?" etc.
```

#### 5. iOS fullReset is Slow

**Problem:** `fullReset: true` reinstalls the app on every test file, adding 30-60s.

**Solution:** Use `fullReset: false` with simctl data clearing:
```typescript
// In wdio.ios.conf.ts - use fast reset
'appium:fullReset': false,

// In before hook - clear data via simctl
function clearIOSAppData() {
  const containerPath = execSync(
    `xcrun simctl get_app_container booted com.miden.wallet data`
  ).toString().trim();
  execSync(`rm -rf "${containerPath}/Library/WebKit"`);
  execSync(`rm -rf "${containerPath}/Library/Preferences"`);
  // ... etc
}
```

#### 6. Context Switching Overhead

**Problem:** Frequent context switches add latency.

**Solution:** Batch operations in the same context:
```typescript
// WRONG - switches back and forth
await switchToWebviewContext();
await setInput1();
await switchToNativeContext();
await clickButton();
await switchToWebviewContext();
await setInput2();

// CORRECT - batch WebView operations
await switchToWebviewContext();
await setInput1();
await setInput2();
await switchToNativeContext();
await clickButton();
```

#### 7. Wallet Creation Takes 2+ Minutes

**Problem:** Wallet creation involves key generation and node sync which genuinely takes time.

**Solution:** Use long timeouts for the "Get started" button (wallet ready screen):
```typescript
// 180 seconds for wallet creation to complete
const getStartedButton = await $(Selectors.getStartedButton);
await getStartedButton.waitForDisplayed({ timeout: 180000 });
```

### Writing New Tests

#### Test File Template

```typescript
import { resetAppState, waitForAppReady, TEST_PASSWORD } from '../../fixtures/app';
import { Selectors } from '../../helpers/selectors';

describe('Feature Name', () => {
  beforeEach(async () => {
    await resetAppState();  // Fresh app state for each test
  });

  it('should do something', async () => {
    await waitForAppReady();

    // Find elements using Selectors
    const button = await $(Selectors.someButton);
    await button.waitForDisplayed({ timeout: 10000 });
    await button.click();

    // Verify result
    const result = await $(Selectors.expectedElement);
    await expect(result).toBeDisplayed();
  });
});
```

#### Adding New Selectors

Add to `helpers/selectors.ts`:
```typescript
export const Selectors = {
  // ... existing selectors

  // Use getter for platform-aware selector
  get myNewButton() {
    return platformButton('Button Text');
  },
  get myNewText() {
    return platformText('Some text');
  },
};
```

#### Platform-Specific Test Logic

```typescript
import { isIOSPlatform } from '../helpers/webview';

if (isIOSPlatform()) {
  // iOS-specific behavior
  await clickLinkViaJS('Send', '/send');
} else {
  // Android-specific behavior
  const button = await $('//*[contains(@text, "Send")]');
  await button.click();
}
```

### Configuration Reference

#### iOS Config (`wdio.ios.conf.ts`)

Key capabilities:
- `appium:fullReset: false` - Fast reset via simctl
- `appium:nativeWebTap: true` - Better WebView element interaction
- `appium:webviewConnectTimeout: 30000` - Time to wait for WebView context

#### Android Config (`wdio.android.conf.ts`)

Key capabilities:
- `appium:autoGrantPermissions: true` - Auto-accept permission dialogs
- `appium:disableWindowAnimation: true` - Faster tests
- `appium:skipUnlock: true` - Skip lock screen

#### Shared Config (`wdio.shared.conf.ts`)

- `mochaOpts.timeout: 120000` - 2 min timeout per test
- `afterTest` hook takes screenshot on failure

### Debugging Tips

1. **Screenshots on failure**: Automatically saved to `mobile-e2e/screenshots/`

2. **Appium logs**: Check `mobile-e2e/logs/appium-ios.log` or `appium-android.log`

3. **Element inspection**: Use Appium Inspector or:
   ```typescript
   const source = await driver.getPageSource();
   console.log(source);
   ```

4. **Context debugging**:
   ```typescript
   const contexts = await driver.getContexts();
   console.log('Available contexts:', contexts);
   ```

## Internationalization (i18n)

**IMPORTANT:** All user-facing text in React components MUST be internationalized. Never use hardcoded strings for UI text - always use `t('key')` or the `<T id="key" />` component. CI will block PRs with non-i18n'd strings (enforced by `yarn lint:i18n`).

When adding new translatable strings, add them to `public/_locales/en/en.json`, NOT `messages.json`.

- `en.json` - Flat format source file (`"key": "value"`). The translation script reads from this file.
- `messages.json` - Chrome extension format (`"key": { "message": "value", "englishSource": "value" }`). Auto-generated.

### Adding new i18n strings

1. Add the key to `public/_locales/en/en.json` in flat format:
   ```json
   "myNewKey": "My new translatable string"
   ```

2. Use in React components with `useTranslation` hook:
   ```typescript
   import { useTranslation } from 'react-i18next';

   const { t } = useTranslation();
   return <span>{t('myNewKey')}</span>;
   ```

3. CI will auto-translate to other languages via `yarn createTranslationFile`

### Placeholders in translations

Use `$placeholder$` format for dynamic values:
```json
"greeting": "Hello $name$, you have $count$ messages"
```

## Transaction Processing

### Background Transaction Processing

For operations that should happen silently (like auto-consume), use `startBackgroundTransactionProcessing`:

```typescript
import { startBackgroundTransactionProcessing } from 'lib/miden/activity';
import { useMidenContext } from 'lib/miden/front';

const { signTransaction } = useMidenContext();

// Queue transactions first
await initiateConsumeTransaction(accountPublicKey, note, isDelegatedProvingEnabled);

// Then process silently in background (no modal/tab)
startBackgroundTransactionProcessing(signTransaction);
```

This is preferred over `openLoadingFullPage()` for automatic operations because:
- Doesn't interrupt the user with a modal (mobile) or new tab (desktop)
- Polls every 5 seconds for up to 5 minutes
- Works on both mobile and desktop

### Transaction States

Transactions flow through these states in `ITransactionStatus`:
1. `Queued` (0) - Initial state when transaction is created
2. `GeneratingTransaction` (1) - Being processed
3. `Completed` (2) - Successfully finished
4. `Failed` (3) - Error occurred

## Important Notes

- **Never push without explicit request.** Creating commits is fine, but never run `git push` unless the user explicitly asks.
- **Keep commit messages short.** Use single-line messages (e.g., "fix: add missing i18n keys").
- Uses yarn, not npm (yarn.lock is the lockfile)
- Browser extension APIs via `webextension-polyfill`
- Miden SDK is a WASM module (`@demox-labs/miden-sdk`)
- Sensitive data (vault, keys) stays in backend only
- Frontend receives sanitized state via `toFront()` in backend store
