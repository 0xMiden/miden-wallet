import browser from 'webextension-polyfill';

import * as Repo from 'lib/miden/repo';

export async function clearStorage() {
  await Repo.db.delete();
  await Repo.db.open();
  await browser.storage.local.clear();
}
