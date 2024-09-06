import { FC, useCallback, useLayoutEffect, useRef } from 'react';

import constate from 'constate';
import browser from 'webextension-polyfill';

import { createUrl } from 'lib/woozie';

export const IS_DEV_ENV = process.env.NODE_ENV === 'development';

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
    openInFullPage();
    if (appEnv.popup) {
      window.close();
    }
  }, [appEnv.popup]);

  return null;
};

export function openInFullPage() {
  const { search, hash } = window.location;
  const url = createUrl('fullpage.html', search, hash);
  browser.tabs.create({
    url: browser.runtime.getURL(url)
  });
}

function createLoadingFullPageUrl() {
  const url = createUrl('fullpage.html', '', '#/generating-transaction');
  return browser.runtime.getURL(url);
}

export async function openLoadingFullPage() {
  // Generate url
  const generatingTransactionUrl = createLoadingFullPageUrl();

  // If not already open, open generating transaction url
  const openTabs = await browser.tabs.query({});
  if (openTabs.filter(t => t.url === generatingTransactionUrl).length === 0)
    browser.tabs.create({
      url: generatingTransactionUrl,
      active: false
    });
}

export async function closeLoadingFullPage() {
  // Generate url
  const generatingTransactionUrl = createLoadingFullPageUrl();

  const openTabs = await browser.tabs.query({});
  const ids = openTabs
    .filter(t => t.url === generatingTransactionUrl)
    .map(t => t.id)
    .filter(id => !!id) as number[];

  browser.tabs.remove(ids);
}
