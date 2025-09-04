import browser from 'webextension-polyfill';

import * as Repo from 'lib/miden/repo';

export async function clearStorage(clearDb: boolean = true) {
  if (clearDb) {
    await Repo.db.delete();
    await Repo.db.open();
  }
  await browser.storage.local.clear();
}

export function clearClientStorage() {
  localStorage.clear();
  sessionStorage.clear();
}
