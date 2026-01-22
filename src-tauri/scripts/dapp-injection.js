/**
 * Desktop dApp Browser Injection Script
 *
 * This script is injected into dApp pages opened in the Tauri desktop browser.
 * It provides:
 * 1. A navigation toolbar (back, forward, URL display, close)
 * 2. The `window.midenWallet` API for dApp connectivity
 *
 * Communication with the main wallet happens via Tauri's IPC postMessage.
 */
(function () {
  // Prevent double injection
  if (window.__midenDappToolbarInjected) return;
  window.__midenDappToolbarInjected = true;

  // Check if we have Tauri IPC available (from initialization script context)
  const hasTauriIpc = typeof window.__TAURI_INTERNALS__ !== 'undefined';
  console.log('[Miden Wallet] Tauri IPC available:', hasTauriIpc);

  // Wait for body to exist
  if (!document.body) {
    document.addEventListener('DOMContentLoaded', init);
    return;
  }
  init();

  function init() {
    injectToolbar();
    injectWalletAPI();
    console.log('[Miden Wallet] Desktop dApp browser initialized');
  }

  // Invoke a Tauri command using the internal IPC
  function tauriInvoke(cmd, args) {
    return new Promise((resolve, reject) => {
      if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
        window.__TAURI_INTERNALS__.invoke(cmd, args)
          .then(resolve)
          .catch(reject);
      } else if (window.__TAURI__ && window.__TAURI__.core) {
        window.__TAURI__.core.invoke(cmd, args)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error('Tauri IPC not available'));
      }
    });
  }

  function injectToolbar() {
    // Create toolbar container
    const toolbar = document.createElement('div');
    toolbar.id = 'miden-dapp-toolbar';
    toolbar.innerHTML = `
      <button id="miden-back" title="Back" aria-label="Go back">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <button id="miden-forward" title="Forward" aria-label="Go forward">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
      <button id="miden-refresh" title="Refresh" aria-label="Refresh page">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 4v6h-6M1 20v-6h6"/>
          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
        </svg>
      </button>
      <div id="miden-url-container">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
        </svg>
        <span id="miden-url">${location.href}</span>
      </div>
      <button id="miden-close" title="Close" aria-label="Close browser">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
      #miden-dapp-toolbar {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        height: 48px !important;
        z-index: 2147483647 !important;
        background: linear-gradient(to bottom, #1a1a1a, #0f0f0f) !important;
        display: flex !important;
        align-items: center !important;
        padding: 0 12px !important;
        gap: 8px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        border-bottom: 1px solid #333 !important;
        box-sizing: border-box !important;
      }

      #miden-dapp-toolbar * {
        box-sizing: border-box !important;
      }

      #miden-dapp-toolbar button {
        width: 32px !important;
        height: 32px !important;
        min-width: 32px !important;
        border-radius: 6px !important;
        background: #2a2a2a !important;
        border: 1px solid #444 !important;
        color: #e0e0e0 !important;
        cursor: pointer !important;
        font-size: 16px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        transition: all 0.15s ease !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      #miden-dapp-toolbar button:hover {
        background: #3a3a3a !important;
        border-color: #555 !important;
      }

      #miden-dapp-toolbar button:active {
        background: #4a4a4a !important;
        transform: scale(0.95) !important;
      }

      #miden-dapp-toolbar button svg {
        width: 16px !important;
        height: 16px !important;
      }

      #miden-url-container {
        flex: 1 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        background: #2a2a2a !important;
        border: 1px solid #444 !important;
        border-radius: 8px !important;
        padding: 6px 12px !important;
        margin: 0 4px !important;
        overflow: hidden !important;
      }

      #miden-url-container svg {
        flex-shrink: 0 !important;
        color: #888 !important;
      }

      #miden-url {
        flex: 1 !important;
        color: #aaa !important;
        font-size: 13px !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      }

      #miden-close {
        background: #3a2020 !important;
        border-color: #5a3030 !important;
      }

      #miden-close:hover {
        background: #5a3030 !important;
        border-color: #7a4040 !important;
      }

      /* Push page content down to make room for toolbar */
      html {
        margin-top: 48px !important;
      }

      /* Handle fixed position elements */
      body > [style*="position: fixed"][style*="top: 0"],
      body > [style*="position:fixed"][style*="top:0"] {
        top: 48px !important;
      }
    `;

    document.head.appendChild(style);
    document.body.prepend(toolbar);

    // Button handlers using Tauri IPC
    document.getElementById('miden-back').onclick = () => {
      tauriInvoke('dapp_navigate', { action: 'back' }).catch(() => history.back());
    };

    document.getElementById('miden-forward').onclick = () => {
      tauriInvoke('dapp_navigate', { action: 'forward' }).catch(() => history.forward());
    };

    document.getElementById('miden-refresh').onclick = () => {
      tauriInvoke('dapp_navigate', { action: 'refresh' }).catch(() => location.reload());
    };

    document.getElementById('miden-close').onclick = () => {
      tauriInvoke('close_dapp_window').catch(console.error);
    };

    // Update URL display on navigation
    function updateUrl() {
      const el = document.getElementById('miden-url');
      if (el) el.textContent = location.href;
    }

    window.addEventListener('popstate', updateUrl);

    // Observe for SPA navigation (intercept pushState/replaceState)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
      originalPushState.apply(history, arguments);
      updateUrl();
    };

    history.replaceState = function () {
      originalReplaceState.apply(history, arguments);
      updateUrl();
    };

    // Use MutationObserver to detect toolbar removal and re-inject
    const observer = new MutationObserver(() => {
      if (!document.getElementById('miden-dapp-toolbar')) {
        console.log('[Miden Wallet] Toolbar removed, re-injecting');
        document.body.prepend(toolbar);
      }
    });

    observer.observe(document.body, { childList: true });
  }

  function injectWalletAPI() {
    // Don't inject if already present
    if (window.midenWallet) return;

    // Simple EventEmitter implementation
    class EventEmitter {
      constructor() {
        this._events = {};
      }
      on(event, listener) {
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(listener);
        return () => this.off(event, listener);
      }
      off(event, listener) {
        if (!this._events[event]) return;
        this._events[event] = this._events[event].filter((l) => l !== listener);
      }
      emit(event, ...args) {
        if (!this._events[event]) return;
        this._events[event].forEach((listener) => listener(...args));
      }
    }

    // Pending requests map
    const pendingRequests = new Map();
    let requestId = 0;

    // Send message to wallet via Tauri IPC
    function sendToWallet(type, payload, reqId) {
      const message = { type, payload, reqId };

      tauriInvoke('dapp_wallet_request', { request: JSON.stringify(message) })
        .then((response) => {
          // The immediate response is empty - actual response comes via eval callback
          console.log('[MidenWallet] Request sent successfully');
        })
        .catch((error) => {
          console.error('[MidenWallet] IPC error:', error);
          const pending = pendingRequests.get(reqId);
          if (pending) {
            pendingRequests.delete(reqId);
            pending.reject(new Error(String(error)));
          }
        });
    }

    // Make request to wallet
    function request(payload) {
      return new Promise((resolve, reject) => {
        const reqId = 'req_' + ++requestId;
        pendingRequests.set(reqId, { resolve, reject });
        console.log('[MidenWallet] Sending request:', reqId, typeof payload === 'string' ? payload : payload.type);
        sendToWallet('MIDEN_PAGE_REQUEST', payload, reqId);

        // Timeout after 5 minutes (for long operations like proof generation)
        setTimeout(() => {
          if (pendingRequests.has(reqId)) {
            console.warn('[MidenWallet] Request timeout:', reqId);
            pendingRequests.delete(reqId);
            reject(new Error('Request timeout'));
          }
        }, 300000);
      });
    }

    // Handle response from wallet (called via eval from Rust)
    function handleWalletResponse(responseStr) {
      console.log('[MidenWallet] Received response');
      try {
        const response =
          typeof responseStr === 'string' ? JSON.parse(responseStr) : responseStr;
        const { type, payload, reqId, error } = response;

        console.log('[MidenWallet] Response for reqId:', reqId, 'type:', type);

        const pending = pendingRequests.get(reqId);
        if (!pending) {
          console.warn('[MidenWallet] No pending request for reqId:', reqId);
          return;
        }

        pendingRequests.delete(reqId);

        if (type === 'MIDEN_PAGE_ERROR_RESPONSE' || error) {
          pending.reject(new Error(error || payload || 'Unknown error'));
        } else {
          pending.resolve(payload);
        }
      } catch (e) {
        console.error('[MidenWallet] Error handling response:', e);
      }
    }

    // Expose response handler globally for Tauri to call
    window.__midenWalletResponse = handleWalletResponse;

    // Helper functions
    function b64ToU8(b64) {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }

    function u8ToB64(u8) {
      let binary = '';
      for (let i = 0; i < u8.length; i++) {
        binary += String.fromCharCode(u8[i]);
      }
      return btoa(binary);
    }

    function bytesToHex(bytes) {
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // MidenWallet class
    class MidenWallet extends EventEmitter {
      constructor() {
        super();
        this.address = undefined;
        this.publicKey = undefined;
        this.permission = undefined;
        this.appName = undefined;
        this.network = undefined;
      }

      async isAvailable() {
        try {
          const res = await request('PING');
          return res === 'PONG';
        } catch {
          return false;
        }
      }

      async connect(privateDataPermission, network, allowedPrivateData) {
        const res = await request({
          type: 'PERMISSION_REQUEST',
          appMeta: { name: window.location.hostname },
          force: false,
          privateDataPermission,
          network,
          allowedPrivateData,
        });

        this.permission = {
          rpc: res.network,
          address: res.accountId,
          privateDataPermission: res.privateDataPermission,
          allowedPrivateData: res.allowedPrivateData,
        };
        this.address = res.accountId;
        this.network = network;
        this.publicKey = b64ToU8(res.publicKey);

        // Emit connect event for wallet adapters that listen to events
        this.emit('connect', this.publicKey);

        return this.permission;
      }

      async disconnect() {
        await request({ type: 'DISCONNECT_REQUEST' });
        this.address = undefined;
        this.permission = undefined;
        this.publicKey = undefined;
        this.emit('disconnect');
      }

      async requestSend(transaction) {
        const res = await request({
          type: 'SEND_TRANSACTION_REQUEST',
          sourcePublicKey: this.address,
          transaction,
        });
        return { transactionId: res.transactionId };
      }

      async requestConsume(transaction) {
        const res = await request({
          type: 'CONSUME_REQUEST',
          sourcePublicKey: this.address,
          transaction,
        });
        return { transactionId: res.transactionId };
      }

      async requestTransaction(transaction) {
        const res = await request({
          type: 'TRANSACTION_REQUEST',
          sourcePublicKey: this.address,
          transaction,
        });
        return { transactionId: res.transactionId };
      }

      async requestPrivateNotes(notefilterType, noteIds) {
        const res = await request({
          type: 'PRIVATE_NOTES_REQUEST',
          sourcePublicKey: this.address,
          notefilterType,
          noteIds,
        });
        return { privateNotes: res.privateNotes };
      }

      async waitForTransaction(txId) {
        const res = await request({
          type: 'WAIT_FOR_TRANSACTION_REQUEST',
          txId,
        });
        return res.transactionOutput;
      }

      async signBytes(data, kind) {
        const publicKeyAsHex = bytesToHex(this.publicKey);
        const messageAsB64 = u8ToB64(data);

        const res = await request({
          type: 'SIGN_REQUEST',
          sourceAccountId: this.address,
          sourcePublicKey: publicKeyAsHex,
          payload: messageAsB64,
          kind,
        });

        return { signature: b64ToU8(res.signature) };
      }

      async importPrivateNote(note) {
        const noteAsB64 = u8ToB64(note);

        const res = await request({
          type: 'IMPORT_PRIVATE_NOTE_REQUEST',
          sourcePublicKey: this.address,
          note: noteAsB64,
        });

        return { noteId: res.noteId };
      }

      async requestAssets() {
        const res = await request({
          type: 'ASSETS_REQUEST',
          sourcePublicKey: this.address,
        });
        return { assets: res.assets };
      }

      async requestConsumableNotes() {
        const res = await request({
          type: 'CONSUMABLE_NOTES_REQUEST',
          sourcePublicKey: this.address,
        });
        return { consumableNotes: res.consumableNotes };
      }
    }

    // Create and expose the wallet instance
    const midenWallet = new MidenWallet();

    try {
      Object.defineProperty(window, 'midenWallet', {
        value: midenWallet,
        writable: false,
        configurable: false,
      });
    } catch (e) {
      window.midenWallet = midenWallet;
    }

    console.log('[MidenWallet] Desktop wallet adapter injected, Tauri IPC:', hasTauriIpc);
  }
})();
