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

## Commands

```bash
yarn install          # Install dependencies
yarn build            # Build extension (outputs to dist/)
yarn dev              # Development build with watch
yarn test             # Run Jest tests
yarn lint             # ESLint
yarn format           # Prettier
```

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

The mobile app shares the same React codebase as the browser extension. Mobile-specific code uses `isMobile()` checks from `lib/mobile/platform.ts`.

### Platform-Specific Changes

**CRITICAL:** This app builds for three platforms: Chrome extension, iOS, and Android. When fixing bugs or adding features:

1. **Isolate platform-specific fixes** - If a bug only affects iOS, wrap the fix with platform detection (e.g., `if (isIOS()) { ... }`). Don't apply iOS fixes globally unless they genuinely apply to all platforms.
2. **Test across platforms** - Changes to shared code can break other platforms unexpectedly.
3. **Use platform detection** - `isMobile()`, `isIOS()`, `isAndroid()` from `lib/mobile/platform.ts` for conditional logic.

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
