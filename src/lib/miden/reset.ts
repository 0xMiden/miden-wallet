import * as Repo from 'lib/miden/repo';
import { isMobile } from 'lib/platform';

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
