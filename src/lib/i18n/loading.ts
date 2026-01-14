import i18n from 'i18next';
import { runtime } from 'webextension-polyfill';

import { init } from './core';
import { saveLocale } from './saving';

export const REFRESH_MSGTYPE = 'ALEO_I18N_REFRESH';

// Normalize locale codes: en_GB -> en-GB for i18next
function normalizeLocale(locale: string): string {
  return locale.replace('_', '-');
}

runtime.onMessage.addListener((msg: unknown) => {
  if (typeof msg === 'object' && msg !== null && (msg as { type?: string }).type === REFRESH_MSGTYPE) {
    const locale = (msg as { locale?: string }).locale;
    if (locale) {
      i18n.changeLanguage(normalizeLocale(locale));
    }
  }
});

export function onInited(callback: () => void) {
  init().then(callback);
}

export async function updateLocale(locale: string) {
  saveLocale(locale);
  await i18n.changeLanguage(normalizeLocale(locale));
  notifyOthers(locale);
}

function notifyOthers(locale: string) {
  runtime.sendMessage({ type: REFRESH_MSGTYPE, locale });
}
