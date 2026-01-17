import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { InAppBrowser, ToolBarType } from '@capgo/inappbrowser';

import { isMobile } from 'lib/platform';

const DOWNLOAD_INTERCEPTOR_SCRIPT = `
(function() {
  if (window.__downloadInterceptorInjected) return;
  window.__downloadInterceptorInjected = true;

  // Intercept <a download> clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a[download]');
    if (link) {
      e.preventDefault();
      e.stopPropagation();

      const href = link.href;
      const filename = link.download || 'download';

      // Handle blob URLs
      if (href.startsWith('blob:')) {
        fetch(href)
          .then(r => r.text())
          .then(content => {
            window.mobileApp.postMessage({
              type: 'DOWNLOAD_FILE',
              filename: filename,
              content: content
            });
          })
          .catch(err => console.error('Download intercept error:', err));
      } else {
        // Handle regular URLs - fetch and send content
        fetch(href)
          .then(r => r.text())
          .then(content => {
            window.mobileApp.postMessage({
              type: 'DOWNLOAD_FILE',
              filename: filename,
              content: content
            });
          })
          .catch(err => console.error('Download intercept error:', err));
      }
    }
  }, true);

  console.log('[FaucetWebview] Download interceptor injected');
})();
`;

// Allowed faucet domains for script injection (App Store compliance)
const FAUCET_DOMAINS = ['faucet.testnet.miden.io', 'faucet.devnet.miden.io', 'localhost'];

export interface FaucetWebviewOptions {
  url: string;
  title: string;
}

export async function openFaucetWebview({ url, title }: FaucetWebviewOptions): Promise<void> {
  if (!isMobile()) {
    window.open(url, '_blank');
    return;
  }

  // Set up message listener for download requests
  const messageListener = await InAppBrowser.addListener('messageFromWebview', async event => {
    try {
      const eventData = (event as { detail?: unknown }).detail || event;
      const message = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;

      if (message.type === 'DOWNLOAD_FILE') {
        const { filename, content } = message;

        // Write to cache directory
        const result = await Filesystem.writeFile({
          path: filename,
          data: content,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        // Open share dialog for user to save
        await Share.share({
          title: filename,
          url: result.uri,
          dialogTitle: 'Save file'
        });
      }
    } catch (error) {
      console.error('[FaucetWebview] Error handling message:', error);
    }
  });

  // Inject download interceptor when page loads (only on faucet domains)
  const loadListener = await InAppBrowser.addListener('browserPageLoaded', async () => {
    try {
      const currentUrl = new URL(url);
      if (FAUCET_DOMAINS.some(domain => currentUrl.hostname.includes(domain))) {
        await InAppBrowser.executeScript({ code: DOWNLOAD_INTERCEPTOR_SCRIPT });
      }
    } catch (e) {
      console.error('[FaucetWebview] Error injecting script:', e);
    }
  });

  // Clean up listeners when browser closes
  const closeListener = await InAppBrowser.addListener('closeEvent', () => {
    messageListener.remove();
    loadListener.remove();
    closeListener.remove();
  });

  // Open the webview
  await InAppBrowser.openWebView({
    url,
    title,
    toolbarType: ToolBarType.NAVIGATION,
    showReloadButton: true
  });
}
