import { isMobile } from 'lib/platform';
import { getStorageProvider } from 'lib/platform/storage-adapter';
import * as Repo from 'lib/miden/repo';

export async function clearStorage(clearDb: boolean = true) {
  if (clearDb) {
    await Repo.db.delete();
    await Repo.db.open();
  }

  if (isMobile()) {
    // On mobile, use the storage adapter
    const storage = getStorageProvider();
    // Clear all keys by setting them to undefined individually
    // Note: The adapter doesn't have a clear() method, so we'd need to
    // track keys or use native Preferences.clear()
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
