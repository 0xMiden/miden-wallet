# Mobile App Migration Assessment: Capacitor.js Approach

## User Requirements
- **Priority**: Maximum code reuse between extension and mobile
- **DApp Support**: In-app DApp browser - WebView that injects wallet adapter into pages (like MetaMask Mobile)

## Executive Summary

**Overall Effort: Medium-High (5-7 weeks)** - Capacitor can reuse ~70-80% of your React UI code, but the backend architecture requires significant rework. The service worker pattern doesn't translate to mobile. DApp browser is achievable by injecting your existing adapter into a WebView.

---

## What You Can Reuse (Good News)

### Frontend (~70-80% Reusable)
| Component | Reusability | Notes |
|-----------|-------------|-------|
| React components | ✅ 95% | All UI components work as-is |
| Tailwind CSS | ✅ 100% | Styling works perfectly |
| Zustand store | ✅ 100% | State management unchanged |
| Framer Motion | ✅ 100% | Animations work in webview |
| React Hook Form | ✅ 100% | Forms work unchanged |
| i18n (react-i18next) | ✅ 100% | Translations work |
| SWR data fetching | ✅ 100% | Network calls work |

### Core Business Logic (~90% Reusable)
| Component | Reusability | Notes |
|-----------|-------------|-------|
| Vault crypto logic | ✅ 100% | Pure JS + Web Crypto API |
| Effector store | ✅ 100% | No extension dependencies |
| Password derivation | ✅ 100% | Uses standard Web Crypto |
| Miden SDK (WASM) | ⚠️ 85% | Works, but worker pattern needs adjustment |

---

## What Needs Rework

### 1. Intercom Messaging System (Critical - ~2 weeks effort)

**Current**: Port-based messaging via `browser.runtime.connect()`
```
Frontend ──[port.postMessage]──► Service Worker
```

**Problem**: Capacitor doesn't have browser extension ports.

**Solution: Adapter Pattern (Minimal Changes to Existing Code)**

Create a mobile adapter that implements the same interface but calls backend functions directly:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Extension (unchanged)                       │
├─────────────────────────────────────────────────────────────────┤
│  Frontend                        Service Worker                  │
│     │                                 │                          │
│     └── IntercomClient ──[port]──► IntercomServer ──► actions   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Mobile (adapter layer)                      │
├─────────────────────────────────────────────────────────────────┤
│  Frontend                                                        │
│     │                                                            │
│     └── IntercomClient ──► MobileAdapter ──► actions (direct)   │
│                                │                                 │
│                                └─ Same backend code, no ports    │
└─────────────────────────────────────────────────────────────────┘
```

**Implementation:**

```typescript
// NEW FILE: src/lib/intercom/mobile-adapter.ts
import { handleRequest } from 'lib/miden/back/actions';

export class MobileIntercomAdapter {
  async request<T>(payload: any): Promise<T> {
    // Directly call backend handler, no port messaging
    const response = await handleRequest(payload);
    return response as T;
  }

  subscribe(listener: (msg: any) => void): () => void {
    // For state updates, use event emitter or direct callbacks
    return subscribeToStore(listener);
  }
}
```

```typescript
// SMALL CHANGE: src/lib/intercom/client.ts (add 5 lines)
import { platform } from 'lib/platform';
import { MobileIntercomAdapter } from './mobile-adapter';

export function createIntercomClient() {
  if (platform.isMobile()) {
    return new MobileIntercomAdapter();
  }
  return new IntercomClient(); // existing code
}
```

**What stays unchanged:**
- `src/lib/miden/back/actions.ts` - same request handlers
- `src/lib/miden/back/vault.ts` - same vault logic
- `src/lib/miden/back/store.ts` - same Effector store
- `src/lib/store/index.ts` - same Zustand store
- All React components - same `useMidenContext()` calls

**What's new (additive):**
- `src/lib/intercom/mobile-adapter.ts` - adapter for direct calls
- `src/lib/platform/index.ts` - platform detection
- `src/mobile-app.tsx` - mobile entry point (parallel to popup.tsx)

### 2. Storage Layer (Medium - ~1 week effort)

**Current**: `browser.storage.local` with encryption layer in `safe-storage.ts`

**Solution: Storage Adapter (Minimal Changes)**

```typescript
// NEW FILE: src/lib/platform/storage-adapter.ts
import { Preferences } from '@capacitor/preferences';

export interface StorageProvider {
  get(keys: string[]): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
  remove(keys: string[]): Promise<void>;
}

// Extension implementation (wraps existing)
export class ExtensionStorage implements StorageProvider {
  async get(keys: string[]) {
    return browser.storage.local.get(keys);
  }
  // ...
}

// Mobile implementation (new)
export class CapacitorStorage implements StorageProvider {
  async get(keys: string[]) {
    const result: Record<string, any> = {};
    for (const key of keys) {
      const { value } = await Preferences.get({ key });
      result[key] = value ? JSON.parse(value) : undefined;
    }
    return result;
  }
  // ...
}
```

```typescript
// SMALL CHANGE: src/lib/miden/back/safe-storage.ts (add 3 lines at top)
import { getStorageProvider } from 'lib/platform/storage-adapter';

const storage = getStorageProvider(); // Returns ExtensionStorage or CapacitorStorage

// Then replace `browser.storage.local` with `storage` (find/replace)
```

**What stays unchanged:**
- All encryption/decryption logic in `safe-storage.ts`
- Vault storage key structure
- `encryptAndSaveMany`, `fetchAndDecryptOne` function signatures

**What's new (additive):**
- `src/lib/platform/storage-adapter.ts` - storage interface + implementations

### 3. Window/Tab Management (Medium - ~1 week effort)

**Current**: Opens separate windows for DApp confirmations via `browser.windows.create()`

**Mobile Alternative**: Modal overlays (you already have `react-modal` installed)

Files affected:
- `src/lib/miden/back/dapp.ts` (~200 lines of window management)
- `src/app/env.ts` (tab management)
- `src/popup.tsx` (popup detection)

### 4. WASM Web Workers (Medium-High - ~1.5 weeks effort)

**Current**: Heavy crypto operations run in Web Workers:
- `sendTransaction.ts` - ZK proof generation (2-10s desktop, 5-20s+ mobile)
- `submitTransaction.ts` - network submission
- `consumeNoteId.ts` - note consumption

**Mobile Issue**: Web Workers have limited support in mobile webviews (especially iOS WKWebView). Running on main thread would freeze UI for 5-20+ seconds during proof generation.

**Solution: Capacitor Worker Plugin**

Use `@nicepkg/capacitor-worker` or similar to enable web workers in mobile webviews:

```typescript
// Platform-aware worker creation
import { CapacitorWorker } from '@nicepkg/capacitor-worker';

async function createWorker(scriptPath: string) {
  if (platform.isMobile()) {
    return await CapacitorWorker.create({ script: scriptPath });
  } else {
    return new Worker(scriptPath);
  }
}
```

**Abstraction approach**:
1. Create `src/lib/platform/worker.ts` - unified worker interface
2. Extension: use native `Worker` (existing code)
3. Mobile: use Capacitor worker plugin
4. Same worker scripts (`sendTransaction.ts` etc.) work on both platforms

**Why not main thread**: ZK proofs take 5-20+ seconds on mobile. Freezing UI that long would:
- Make app feel broken
- Risk iOS terminating the app (watchdog timer)
- Terrible UX during the most critical moment (sending funds)

**Fallback**: If Capacitor workers prove unreliable, consider moving proof generation to a native module (Swift/Kotlin) that can run in a background thread.

### 5. Custom Router (Low - ~3 days effort)

**Current**: Custom `woozie` router with `window.history` patching

**Recommendation**: Replace with `react-router-dom` v6 or Ionic's router. This also enables better mobile navigation patterns (gestures, transitions).

---

## Change Impact Summary

### Existing Files Modified (Minimal)

| File | Change | Lines Changed |
|------|--------|---------------|
| `src/lib/intercom/client.ts` | Add platform check + import | ~5 lines |
| `src/lib/miden/back/safe-storage.ts` | Use storage adapter | ~10 lines (find/replace) |
| `src/lib/miden-worker/*.ts` | Use platform worker factory | ~5 lines each |
| `webpack.config.js` | Add mobile build config | ~30 lines |

**Total: ~60 lines of changes to existing files**

### New Files (Additive Layer)

```
src/
├── lib/
│   ├── platform/
│   │   ├── index.ts                 # Platform detection (NEW)
│   │   ├── storage-adapter.ts       # Storage interface (NEW)
│   │   ├── worker-adapter.ts        # Worker interface (NEW)
│   │   ├── secure-storage.ts        # Secure enclave (NEW)
│   │   └── injected-script.ts       # DApp adapter for WebView (NEW)
│   └── intercom/
│       └── mobile-adapter.ts        # Direct call adapter (NEW)
├── screens/
│   └── DAppBrowser/
│       ├── index.tsx                # DApp browser screen (NEW)
│       └── WebViewBridge.tsx        # WebView wrapper (NEW)
├── mobile-app.tsx                   # Mobile entry point (NEW)
└── capacitor.config.ts              # Capacitor config (NEW)
```

### Unchanged Files (Used As-Is)

All of these work without modification:
- `src/lib/miden/back/vault.ts` - Vault logic
- `src/lib/miden/back/actions.ts` - Request handlers
- `src/lib/miden/back/store.ts` - Effector store
- `src/lib/store/index.ts` - Zustand store
- `src/screens/**/*.tsx` - All UI screens
- `src/app/**/*.tsx` - App layout, routing
- `src/lib/ui/**/*.tsx` - UI components
- `src/workers/*.ts` - Worker scripts (loaded differently)

---

## Migration Path (Phased)

### Phase 1: PoC - Technical Validation (~2 weeks)

**Goal**: Prove the critical technical integrations work on mobile before investing in full feature set.

**Success Criteria**:
- [ ] App launches in iOS/Android simulator
- [ ] WASM SDK loads and initializes in mobile webview
- [ ] Capacitor worker plugin runs ZK proofs without freezing UI
- [ ] Login flow works (password unlock)
- [ ] Key storage works (encrypted storage via Capacitor Preferences)
- [ ] Send transaction completes (proof generated, submitted to testnet)
- [ ] Receive/claim note works

**Deliverables**:
```
src/
├── lib/platform/
│   ├── index.ts              # Platform detection
│   ├── storage-adapter.ts    # Capacitor Preferences wrapper
│   └── worker-adapter.ts     # Capacitor worker wrapper
├── lib/intercom/
│   └── mobile-adapter.ts     # Direct call adapter
├── mobile-app.tsx            # Minimal mobile entry point
└── capacitor.config.ts       # Capacitor config

ios/                          # Generated by Capacitor
android/                      # Generated by Capacitor
```

**Tasks**:
1. Initialize Capacitor in project (`npx cap init`)
2. Create platform detection (`src/lib/platform/index.ts`)
3. Create storage adapter with Capacitor Preferences
4. Create worker adapter with `@nicepkg/capacitor-worker`
5. Create mobile intercom adapter (direct backend calls)
6. Create minimal mobile entry point (just account + send screens)
7. Test WASM SDK initialization
8. Test full send transaction flow (ZK proof in worker)
9. Test receive/claim note flow
10. Build and test on real iOS/Android device

**Key Risks to Validate**:
- Capacitor worker plugin actually works with WASM
- WASM SDK doesn't have mobile-specific issues
- Proof generation performance is acceptable (<30s)

---

### Phase 2: Core Feature Parity (~2 weeks)

**Goal**: Full wallet functionality matching extension (minus DApp browser).

**Features**:
- All account operations (create, switch, rename)
- Full send/receive flows with UI polish
- Transaction history
- Settings
- Proper navigation (replace woozie router)

**Tasks**:
1. Integrate all existing screens
2. Replace woozie router with react-router or similar
3. Replace window management with modal overlays
4. Add mobile-appropriate loading states
5. Test all user flows end-to-end

---

### Phase 3: DApp Browser (~2 weeks)

**Goal**: In-app browser that auto-connects DApps to wallet.

**Features**:
- WebView-based browser screen
- Adapter injection into pages
- Transaction confirmation modals
- URL bar + navigation controls

**Tasks**:
1. Build DApp browser screen with WebView
2. Adapt contentScript for WebView injection
3. Build message bridge (WebView ↔ wallet)
4. Test with real Miden DApps

---

### Phase 4: Secure Enclave + Passkey (~2 weeks)

**Goal**: Hardware-backed key protection with biometric unlock.

**Features**:
- Passkey-based authentication
- Secure enclave key storage
- Biometric unlock (Face ID / fingerprint)

**Tasks**:
1. Integrate `@nicepkg/capacitor-passkey`
2. Integrate `@niceteam/capacitor-secure-storage`
3. Build passkey creation flow in onboarding
4. Migrate from password to biometric unlock
5. Test on real devices with biometrics

---

### Phase 5: Polish & Launch (~1 week)

**Goal**: Production-ready mobile app.

**Tasks**:
1. Mobile-specific UI adjustments (safe areas, gestures)
2. Performance profiling and optimization
3. App icons, splash screens
4. App store metadata and screenshots
5. TestFlight / Play Store internal testing
6. Submit for review

---

## Key Risks

1. **WASM Performance**: Miden SDK WASM may be slow in mobile webviews. Mitigation: Profile early, consider native module if needed.

2. **iOS WKWebView Limitations**: WebWorkers and some Web APIs have restrictions. Mitigation: Test on real devices early.

3. **SDK Compatibility**: `@demox-labs/miden-sdk` may not be tested for mobile webviews. Mitigation: Coordinate with SDK maintainers.

4. **Passkey/WebAuthn in WebView**: WebAuthn APIs may have limited support in Capacitor webviews. Mitigation: Use native Capacitor plugins that bridge to platform APIs directly (bypass webview WebAuthn). Some plugins like `@nicepkg/capacitor-passkey` handle this.

5. **Secure Enclave Key Format**: If you ever want to store actual signing keys in SE (not just encryption keys), Miden's curve may not be supported. Current plan avoids this by keeping signing in WASM.

6. **Capacitor Worker Support**: Workers in mobile webviews can be unreliable. Mitigation: Test `@nicepkg/capacitor-worker` early. Fallback: native Swift/Kotlin module for proof generation (higher effort but guaranteed to work).

---

## Secure Enclave + Passkey Integration (Key Feature)

### Current Key Storage (Extension)

```
User Password
     ↓
Passworder.generateKey() → CryptoKey (via Web Crypto)
     ↓
Encrypt/decrypt with AES-GCM
     ↓
browser.storage.local (encrypted blobs)
```

**What's stored encrypted:**
- Master mnemonic (`vault_mnemonic`)
- Account secret keys (`vault_accauthsecretkey_{pubKeyHex}`)
- Account metadata (`vault_accounts`)

### Mobile: Secure Enclave + Passkey Approach

```
┌────────────────────────────────────────────────────────────┐
│                    Mobile Key Architecture                  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────────┐    ┌──────────────────────────┐  │
│  │  Passkey (WebAuthn) │    │  Secure Enclave          │  │
│  │  - Biometric auth   │───►│  - iOS: Keychain + SE    │  │
│  │  - Device-bound     │    │  - Android: Keystore     │  │
│  └─────────────────────┘    └──────────┬───────────────┘  │
│                                        │                   │
│                                        ▼                   │
│                          ┌──────────────────────────┐     │
│                          │  Encryption Key          │     │
│                          │  (derived from passkey)  │     │
│                          └──────────┬───────────────┘     │
│                                     │                      │
│                                     ▼                      │
│                          ┌──────────────────────────┐     │
│                          │  Encrypted Storage       │     │
│                          │  - Master mnemonic       │     │
│                          │  - Account secret keys   │     │
│                          │  - Wallet metadata       │     │
│                          └──────────────────────────┘     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Recommended Approach: Passkey + Encrypted Storage

This gives you:
1. **Biometric authentication** via passkey (Face ID / fingerprint)
2. **Hardware-backed encryption key** in secure enclave
3. **Compatibility** with existing Miden SDK signing flow
4. **Backup/recovery** via mnemonic (still works)

### Security Considerations

1. **No password fallback on mobile** - Device biometrics are the only unlock method
2. **Mnemonic backup essential** - If device is lost, mnemonic is only recovery path
3. **Key derivation stays in JS** - Account keys derived from mnemonic using BIP39/HD paths
4. **Signing stays in WASM** - Miden SDK handles actual cryptographic signing
