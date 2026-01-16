import { FC, useCallback, useLayoutEffect, useRef } from 'react';

import constate from 'constate';

import { isMobile } from 'lib/platform';
import { createUrl } from 'lib/woozie';

export const IS_DEV_ENV = process.env.NODE_ENV === 'development';

// Lazy-loaded browser polyfill (only in extension context)
let browserModule: typeof import('webextension-polyfill') | null = null;
async function getBrowser() {
  if (isMobile()) {
    throw new Error('Browser APIs not available on mobile');
  }
  if (!browserModule) {
    browserModule = await import('webextension-polyfill');
  }
  return browserModule.default;
}

export type AppEnvironment = {
  windowType: WindowType;
  confirmWindow?: boolean;
};

export enum WindowType {
  Popup,
  FullPage
}

export type BackHandler = () => void;

export const [AppEnvProvider, useAppEnv] = constate((env: AppEnvironment) => {
  const fullPage = env.windowType === WindowType.FullPage;
  const popup = env.windowType === WindowType.Popup;
  const confirmWindow = env.confirmWindow ?? false;

  const handlerRef = useRef<BackHandler>();
  const prevHandlerRef = useRef<BackHandler>();

  const onBack = useCallback(() => {
    if (handlerRef.current) {
      handlerRef.current();
    }
  }, []);

  const registerBackHandler = useCallback((handler: BackHandler) => {
    if (handlerRef.current) {
      prevHandlerRef.current = handlerRef.current;
    }
    handlerRef.current = handler;

    return () => {
      if (handlerRef.current === handler) {
        handlerRef.current = prevHandlerRef.current;
      }
    };
  }, []);

  return {
    fullPage,
    popup,
    confirmWindow,
    onBack,
    registerBackHandler
  };
});

export const OpenInFullPage: FC = () => {
  const appEnv = useAppEnv();

  useLayoutEffect(() => {
    // On mobile, we're already in full page mode
    if (isMobile()) {
      return;
    }

    (async () => {
      try {
        const browser = await getBrowser();
        const urls = await onboardingUrls();
        const tabs = await browser.tabs.query({});
        const onboardingTab = tabs.find(t => t.url && urls.includes(t.url));
        if (onboardingTab?.id) {
          browser.tabs.update(onboardingTab.id, { active: true });
          if (appEnv.popup) {
            window.close();
          }
        } else {
          // unable to find existing onboarding tab, open a new one
          await openInFullPage();
          if (appEnv.popup) {
            window.close();
          }
        }
      } catch (err) {
        console.error('OpenInFullPage error:', err);
      }
    })();
  }, [appEnv.popup]);

  return null;
};

export const onboardingUrls = async () => {
  if (isMobile()) {
    return [];
  }

  const browser = await getBrowser();
  const hashes = [
    '',
    '/',
    '/#select-wallet-type',
    '/#select-import-type',
    '/#import-from-file',
    '/#import-seed-phrase',
    '/#backup-seed-phrase',
    '/#verify-seed-phrase',
    '/#create-password',
    '/#confirmation'
  ];

  const urls = hashes.map(hash => {
    return browser.runtime.getURL(createUrl('fullpage.html', '', hash));
  });

  return urls;
};

export async function openInFullPage() {
  if (isMobile()) {
    // On mobile, we're already in full page mode
    return;
  }

  const browser = await getBrowser();
  const { search, hash } = window.location;
  const url = createUrl('fullpage.html', search, hash);
  browser.tabs.create({
    url: browser.runtime.getURL(url)
  });
}

async function createLoadingFullPageUrl() {
  if (isMobile()) {
    return '';
  }
  const browser = await getBrowser();
  const url = createUrl('fullpage.html', '', '#/generating-transaction');
  return browser.runtime.getURL(url);
}

export async function openLoadingFullPage() {
  if (isMobile()) {
    // On mobile, open the transaction progress modal
    const { transactionModalState } = await import('lib/mobile/transaction-modal');
    transactionModalState.open();
    return;
  }

  const browser = await getBrowser();
  // Generate url
  const generatingTransactionUrl = await createLoadingFullPageUrl();

  // If not already open, open generating transaction url
  const openTabs = await browser.tabs.query({});
  if (openTabs.filter(t => t.url === generatingTransactionUrl).length === 0)
    browser.tabs.create({
      url: generatingTransactionUrl,
      active: false
    });
}

export async function closeLoadingFullPage() {
  if (isMobile()) {
    // On mobile, close the transaction progress modal
    const { transactionModalState } = await import('lib/mobile/transaction-modal');
    transactionModalState.close();
    return;
  }

  const browser = await getBrowser();
  // Generate url
  const generatingTransactionUrl = await createLoadingFullPageUrl();

  const openTabs = await browser.tabs.query({});
  const ids = openTabs
    .filter(t => t.url === generatingTransactionUrl)
    .map(t => t.id)
    .filter(id => !!id) as number[];

  browser.tabs.remove(ids);
}

async function createConsumingFullPageUrl(noteId: string) {
  if (isMobile()) {
    return '';
  }
  const browser = await getBrowser();
  const url = createUrl('fullpage.html', '', `#/consuming-note/${noteId}`);
  return browser.runtime.getURL(url);
}

export async function openConsumingFullPage(noteId: string) {
  if (isMobile()) {
    return;
  }

  const browser = await getBrowser();
  const consumingTransactionUrl = await createConsumingFullPageUrl(noteId);

  const openTabs = await browser.tabs.query({});
  if (openTabs.filter(t => t.url === consumingTransactionUrl).length === 0)
    browser.tabs.create({
      url: consumingTransactionUrl,
      active: false
    });
}

export async function closeConsumingFullPage(noteId: string) {
  if (isMobile()) {
    return;
  }

  const browser = await getBrowser();
  const consumingTransactionUrl = await createConsumingFullPageUrl(noteId);

  const openTabs = await browser.tabs.query({});
  const ids = openTabs
    .filter(t => t.url === consumingTransactionUrl)
    .map(t => t.id)
    .filter(id => !!id) as number[];

  browser.tabs.remove(ids);
}
