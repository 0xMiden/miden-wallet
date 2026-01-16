# CLAUDE.md

This file provides guidance for Claude Code when working on this repository.

## Project Overview

Miden Wallet is a browser extension wallet for the Miden blockchain. It's built as a Chrome/Firefox extension with a React frontend and a service worker backend.

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

## Important Notes

- **Never push without explicit request.** Creating commits is fine, but never run `git push` unless the user explicitly asks.
- **Keep commit messages short.** Use single-line messages (e.g., "fix: add missing i18n keys").
- Uses yarn, not npm (yarn.lock is the lockfile)
- Browser extension APIs via `webextension-polyfill`
- Miden SDK is a WASM module (`@demox-labs/miden-sdk`)
- Sensitive data (vault, keys) stays in backend only
- Frontend receives sanitized state via `toFront()` in backend store
