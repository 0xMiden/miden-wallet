import * as Repo from 'lib/miden/repo';
import { isMobile } from 'lib/platform';

/**
 * Reset all wallet data for E2E testing.
 * Clears all IndexedDB databases, Capacitor Preferences, and browser storage.
 * Returns a promise that resolves when clearing is complete (before reload).
 *
 * NOTE: This function is exposed on window.__resetWalletForTesting__ but currently
 * cannot be called from Appium tests due to iOS WebView context isolation issues.
 */
export async function resetForTesting(): Promise<void> {
  // Clear all IndexedDB databases (including Miden SDK's internal DB)
  if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
    try {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(db => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const request = indexedDB.deleteDatabase(db.name!);
              request.onsuccess = () => resolve();
              request.onerror = () => reject(request.error);
              request.onblocked = () => resolve(); // Continue even if blocked
            });
          }
          return Promise.resolve();
        })
      );
    } catch (e) {
      console.warn('[resetForTesting] Failed to clear IndexedDB:', e);
    }
  }

  // Clear Capacitor Preferences (mobile) or browser.storage.local (extension)
  if (isMobile()) {
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.clear();
  } else {
    try {
      const browser = await import('webextension-polyfill');
      await browser.default.storage.local.clear();
    } catch {
      // Not in extension context
    }
  }

  // Clear browser storage
  localStorage.clear();
  sessionStorage.clear();
}

export async function clearStorage(clearDb: boolean = true) {
  if (clearDb) {
    await Repo.db.delete();
    await Repo.db.open();
  }

  if (isMobile()) {
    // On mobile, use native Capacitor Preferences.clear()
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.clear();
  } else {
    // On extension, use browser.storage.local.clear()
    const browser = await import('webextension-polyfill');
    await browser.default.storage.local.clear();
  }
}

export function clearClientStorage() {
  localStorage.clear();
  sessionStorage.clear();
}
