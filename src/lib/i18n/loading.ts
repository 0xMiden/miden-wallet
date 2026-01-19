import i18n from 'i18next';

import { isMobile } from 'lib/platform';

import { init } from './core';
import { saveLocale } from './saving';

export const REFRESH_MSGTYPE = 'ALEO_I18N_REFRESH';

// Normalize locale codes: en_GB -> en-GB for i18next
function normalizeLocale(locale: string): string {
  return locale.replace('_', '-');
}

// Set up extension message listener for cross-tab locale sync (extension only)
if (!isMobile()) {
  import('webextension-polyfill').then(browserModule => {
    const runtime = browserModule.runtime;
    runtime.onMessage.addListener((msg: unknown) => {
      if (typeof msg === 'object' && msg !== null && (msg as { type?: string }).type === REFRESH_MSGTYPE) {
        const locale = (msg as { locale?: string }).locale;
        if (locale) {
          i18n.changeLanguage(normalizeLocale(locale));
        }
      }
    });
  });
}

export function onInited(callback: () => void) {
  init().then(callback);
}

export async function updateLocale(locale: string) {
  saveLocale(locale);
  await i18n.changeLanguage(normalizeLocale(locale));
  notifyOthers(locale);
}

function notifyOthers(locale: string) {
  // On mobile, no need to notify other tabs/windows
  if (isMobile()) {
    return;
  }

  import('webextension-polyfill').then(browserModule => {
    browserModule.runtime.sendMessage({ type: REFRESH_MSGTYPE, locale }).catch(() => {
      // Ignore errors when no other contexts are listening
    });
  });
}
