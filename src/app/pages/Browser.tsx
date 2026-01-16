import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import { InAppBrowser, ToolBarType } from '@capgo/inappbrowser';
import { useTranslation } from 'react-i18next';

import { useAppEnv } from 'app/env';
import { Icon, IconName } from 'app/icons/v2';
import Footer from 'app/layouts/PageLayout/Footer';
import Header from 'app/layouts/PageLayout/Header';
import faucetIcon from 'app/misc/dapp-icons/faucet.png';
import midenIcon from 'app/misc/dapp-icons/miden.png';
import xIcon from 'app/misc/dapp-icons/x.png';
import zoroIcon from 'app/misc/dapp-icons/zoro.png';
import DAppConnectionModal from 'app/templates/DAppConnectionModal';
import {
  dappConfirmationStore,
  DAppConfirmationRequest,
  DAppConfirmationResult
} from 'lib/dapp-browser/confirmation-store';
import { INJECTION_SCRIPT } from 'lib/dapp-browser/injection-script';
import { handleWebViewMessage, WebViewMessage } from 'lib/dapp-browser/message-handler';
import { isMobile } from 'lib/platform';

const DEFAULT_URL = 'https://';

interface Favourite {
  name: string;
  url: string;
  icon: string;
}

const FAVOURITES: Favourite[] = [
  { name: 'Miden', url: 'https://miden.xyz', icon: midenIcon },
  { name: 'Zoro', url: 'https://app.zoroswap.com/', icon: zoroIcon },
  { name: 'Faucet', url: 'https://faucet.testnet.miden.io/', icon: faucetIcon },
  { name: 'Miden X', url: 'https://x.com/0xMiden', icon: xIcon }
];

const Browser: FC = () => {
  const { t } = useTranslation();
  const { fullPage } = useAppEnv();
  const [url, setUrl] = useState(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);

  // DApp confirmation state
  const [pendingConfirmation, setPendingConfirmation] = useState<DAppConfirmationRequest | null>(null);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const pendingUrlRef = useRef<string | null>(null);
  const originRef = useRef<string | null>(null);

  // On mobile, use responsive dimensions (same pattern as Explore page)
  const containerStyle = isMobile()
    ? { minHeight: '100vh', width: '100%' }
    : fullPage
      ? { height: '640px', width: '600px' }
      : { height: '600px', width: '360px' };

  // Subscribe to confirmation store
  useEffect(() => {
    const unsubscribe = dappConfirmationStore.subscribe(() => {
      const request = dappConfirmationStore.getPendingRequest();
      if (request && isBrowserOpen) {
        console.log('[Browser] Confirmation requested, closing browser for UI');
        // Store the current URL and close the browser to show confirmation UI
        pendingUrlRef.current = url;
        setPendingConfirmation(request);
        // Close the browser so user can see the confirmation modal
        InAppBrowser.close().catch(e => console.error('[Browser] Error closing browser:', e));
        setIsBrowserOpen(false);
      }
    });
    return unsubscribe;
  }, [isBrowserOpen, url]);

  const normalizeUrl = useCallback((inputUrl: string): string => {
    let normalized = inputUrl.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    return normalized;
  }, []);

  const openBrowser = useCallback(
    async (targetUrl: string, skipRecentUpdate = false) => {
      const normalizedUrl = normalizeUrl(targetUrl);
      console.log('[Browser] Opening URL (fullscreen):', normalizedUrl);

      if (!normalizedUrl || normalizedUrl === 'https://') {
        return;
      }

      setIsLoading(true);
      setUrl(normalizedUrl);

      try {
        const urlObj = new URL(normalizedUrl);
        const origin = urlObj.origin;
        originRef.current = origin;

        // Add to recent URLs (skip if reopening after confirmation)
        if (!skipRecentUpdate) {
          setRecentUrls(prev => {
            const filtered = prev.filter(u => u !== normalizedUrl);
            return [normalizedUrl, ...filtered].slice(0, 10);
          });
        }

        // Set up listeners BEFORE opening
        const messageListener = await InAppBrowser.addListener('messageFromWebview', async event => {
          console.log('[Browser] Message from WebView:', event);
          try {
            // The event uses 'detail' property per @capgo/inappbrowser types
            const eventData = event.detail || event;
            const message: WebViewMessage =
              typeof eventData === 'string' ? JSON.parse(eventData) : (eventData as WebViewMessage);
            const response = await handleWebViewMessage(message, origin);
            await InAppBrowser.executeScript({
              code: `window.__midenWalletResponse(${JSON.stringify(JSON.stringify(response))});`
            });
          } catch (error) {
            console.error('[Browser] Error handling WebView message:', error);
          }
        });

        const closeListener = await InAppBrowser.addListener('closeEvent', () => {
          console.log('[Browser] Browser closed event');
          messageListener.remove();
          closeListener.remove();
          setIsLoading(false);
          setIsBrowserOpen(false);
        });

        const loadListener = await InAppBrowser.addListener('browserPageLoaded', async () => {
          console.log('[Browser] Page loaded, injecting script');
          setIsLoading(false);
          try {
            await InAppBrowser.executeScript({ code: INJECTION_SCRIPT });
          } catch (e) {
            console.error('[Browser] Error injecting script:', e);
          }
        });

        const errorListener = await InAppBrowser.addListener('pageLoadError', () => {
          console.error('[Browser] Page load error');
          setIsLoading(false);
        });

        const urlChangeListener = await InAppBrowser.addListener('urlChangeEvent', event => {
          console.log('[Browser] URL changed:', event.url);
          if (event.url) {
            setUrl(event.url);
          }
        });

        InAppBrowser.addListener('closeEvent', () => {
          loadListener.remove();
          errorListener.remove();
          urlChangeListener.remove();
        });

        // Open fullscreen WebView with navigation toolbar
        await InAppBrowser.openWebView({
          url: normalizedUrl,
          title: t('dappBrowser'),
          toolbarType: ToolBarType.NAVIGATION,
          showReloadButton: true
        });

        setIsBrowserOpen(true);
        console.log('[Browser] openWebView returned successfully');
      } catch (error) {
        console.error('[Browser] Error opening browser:', error);
        setIsLoading(false);
      }
    },
    [normalizeUrl, t]
  );

  // Handle confirmation result
  const handleConfirmationResult = useCallback(
    async (result: DAppConfirmationResult) => {
      console.log('[Browser] Confirmation result:', result);
      const savedUrl = pendingUrlRef.current;

      // Clear the pending confirmation
      setPendingConfirmation(null);
      pendingUrlRef.current = null;

      // Resolve the confirmation in the store
      dappConfirmationStore.resolveConfirmation(result);

      // Reopen the browser with the same URL if user approved
      // (we need to reopen regardless to send the response back to the DApp)
      if (savedUrl) {
        // Small delay to let the confirmation promise resolve
        setTimeout(() => {
          openBrowser(savedUrl, true);
        }, 100);
      }
    },
    [openBrowser]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      openBrowser(url);
    },
    [url, openBrowser]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex flex-col m-auto bg-white" style={containerStyle}>
      <Header />

      {/* URL Input */}
      <div className="flex-none px-4 pt-4 pb-2">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2">
            <div className="flex-grow relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Icon name={IconName.Globe} size="sm" className="text-grey-400" />
              </div>
              <input
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('enterUrl')}
                className="w-full pl-10 pr-4 py-3 border border-grey-200 rounded-xl text-base focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !url || url === DEFAULT_URL}
              className="px-4 py-3 bg-primary-500 text-white rounded-xl font-medium disabled:bg-grey-200 disabled:text-grey-400 hover:bg-primary-600 transition-colors"
            >
              {isLoading ? <Icon name={IconName.Loader} size="sm" className="animate-spin" /> : t('go')}
            </button>
          </div>
        </form>
      </div>

      <main className="flex-grow flex flex-col px-4">
        {/* Recent URLs */}
        {recentUrls.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-grey-500 mb-2">{t('recentSites')}</h3>
            <div className="space-y-2">
              {recentUrls.map((recentUrl, index) => (
                <button
                  key={index}
                  onClick={() => openBrowser(recentUrl)}
                  className="w-full flex items-center gap-3 p-3 bg-grey-50 rounded-xl hover:bg-grey-100 transition-colors text-left"
                >
                  <Icon name={IconName.Globe} size="sm" className="text-grey-400 flex-shrink-0" />
                  <span className="text-sm text-grey-700 truncate">{recentUrl}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {recentUrls.length === 0 && (
          <div className="flex-grow flex flex-col items-center justify-center">
            <Icon name={IconName.Globe} size="3xl" className="text-grey-200 mb-4" />
            <h2 className="text-lg font-semibold text-grey-600 mb-2">{t('dappBrowser')}</h2>
            <p className="text-grey-400 text-center text-sm max-w-xs">{t('dappBrowserDescription')}</p>
          </div>
        )}
      </main>

      {/* Favourites Section */}
      <div className="flex-none px-4 pb-4">
        <h3 className="text-sm font-medium text-grey-500 mb-3">{t('favourites')}</h3>
        <div className="grid grid-cols-4 gap-4">
          {FAVOURITES.map(fav => (
            <button
              key={fav.url}
              onClick={() => openBrowser(fav.url)}
              className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-grey-50 active:bg-grey-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-grey-100 flex items-center justify-center overflow-hidden">
                <img src={fav.icon} alt={fav.name} className="w-8 h-8 object-contain" />
              </div>
              <span className="text-xs text-grey-600 text-center truncate w-full">{fav.name}</span>
            </button>
          ))}
        </div>
      </div>

      <Footer />

      {/* DApp Confirmation Modal */}
      {pendingConfirmation && <DAppConnectionModal request={pendingConfirmation} onResult={handleConfirmationResult} />}
    </div>
  );
};

export default Browser;
