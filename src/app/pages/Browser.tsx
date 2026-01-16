import React, { FC, useCallback, useState } from 'react';

import { InAppBrowser, ToolBarType } from '@capgo/inappbrowser';
import { useTranslation } from 'react-i18next';

import { useAppEnv } from 'app/env';
import { Icon, IconName } from 'app/icons/v2';
import Footer from 'app/layouts/PageLayout/Footer';
import Header from 'app/layouts/PageLayout/Header';
import { INJECTION_SCRIPT } from 'lib/dapp-browser/injection-script';
import { handleWebViewMessage, WebViewMessage } from 'lib/dapp-browser/message-handler';
import { isMobile } from 'lib/platform';

const DEFAULT_URL = 'https://';

const Browser: FC = () => {
  const { t } = useTranslation();
  const { fullPage } = useAppEnv();
  const [url, setUrl] = useState(DEFAULT_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);

  // On mobile, use responsive dimensions (same pattern as Explore page)
  const containerStyle = isMobile()
    ? { minHeight: '100vh', width: '100%' }
    : fullPage
      ? { height: '640px', width: '600px' }
      : { height: '600px', width: '360px' };

  const normalizeUrl = useCallback((inputUrl: string): string => {
    let normalized = inputUrl.trim();

    // Add https:// if no protocol specified
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }

    return normalized;
  }, []);

  const openBrowser = useCallback(
    async (targetUrl: string) => {
      const normalizedUrl = normalizeUrl(targetUrl);

      if (!normalizedUrl || normalizedUrl === 'https://') {
        return;
      }

      setIsLoading(true);

      try {
        // Extract origin for DApp permissions
        const urlObj = new URL(normalizedUrl);
        const origin = urlObj.origin;

        // Add to recent URLs
        setRecentUrls(prev => {
          const filtered = prev.filter(u => u !== normalizedUrl);
          return [normalizedUrl, ...filtered].slice(0, 10);
        });

        // Open the InAppBrowser
        await InAppBrowser.openWebView({
          url: normalizedUrl,
          title: t('dappBrowser'),
          toolbarType: ToolBarType.NAVIGATION,
          showArrow: true,
          isPresentAfterPageLoad: false,
          // Inject the wallet adapter script
          preShowScript: INJECTION_SCRIPT
        });

        // Listen for messages from the WebView
        const messageListener = await InAppBrowser.addListener('messageFromWebview', async event => {
          try {
            const message: WebViewMessage = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

            // Process the message and get response
            const response = await handleWebViewMessage(message, origin);

            // Send response back to WebView
            await InAppBrowser.executeScript({
              code: `window.__midenWalletResponse(${JSON.stringify(JSON.stringify(response))});`
            });
          } catch (error) {
            console.error('[Browser] Error handling WebView message:', error);
          }
        });

        // Listen for browser close
        const closeListener = await InAppBrowser.addListener('closeEvent', () => {
          messageListener.remove();
          closeListener.remove();
          setIsLoading(false);
        });

        // Listen for page load to re-inject script if needed
        const loadListener = await InAppBrowser.addListener('pageLoaded', async () => {
          // Re-inject the script on each page load
          await InAppBrowser.executeScript({
            code: INJECTION_SCRIPT
          });
        });

        // Clean up load listener on close
        InAppBrowser.addListener('closeEvent', () => {
          loadListener.remove();
        });
      } catch (error) {
        console.error('[Browser] Error opening browser:', error);
        setIsLoading(false);
      }
    },
    [normalizeUrl, t]
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
        openBrowser(url);
      }
    },
    [url, openBrowser]
  );

  return (
    <div className="flex flex-col m-auto bg-white" style={containerStyle}>
      <Header />
      <main className="flex-grow flex flex-col px-4 py-4">
        {/* URL Input */}
        <form onSubmit={handleSubmit} className="mb-4">
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
      <div className="flex-none">
        <Footer />
      </div>
    </div>
  );
};

export default Browser;
