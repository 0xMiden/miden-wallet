import { Selectors } from '../helpers/selectors';
import {
  switchToWebviewContext,
  switchToNativeContext,
  waitForWebviewContext,
  isWalletAdapterInjected,
  getWebviewUrl,
  executeInWebview
} from '../helpers/webview';

/**
 * Page Object for the DApp Browser
 */
class BrowserPage {
  // Native UI selectors
  get browserTab() {
    return $(Selectors.browserTab);
  }

  get urlInput() {
    return $(Selectors.browserUrlInput);
  }

  get goButton() {
    return $(Selectors.browserGoButton);
  }

  get backButton() {
    return $(Selectors.backButton);
  }

  // Connection approval selectors
  get approveConnectionButton() {
    return $(Selectors.approveConnectionButton);
  }

  get rejectConnectionButton() {
    return $(Selectors.rejectConnectionButton);
  }

  // Transaction approval selectors
  get confirmTransactionButton() {
    return $(Selectors.confirmTransactionButton);
  }

  get rejectTransactionButton() {
    return $(Selectors.rejectTransactionButton);
  }

  get transactionOverlay() {
    return $(Selectors.transactionConfirmationOverlay);
  }

  // Navigation actions

  /**
   * Navigate to browser tab
   */
  async goToBrowserTab(): Promise<void> {
    await this.browserTab.waitForDisplayed({ timeout: 15000 });
    await this.browserTab.click();
    await this.urlInput.waitForDisplayed({ timeout: 15000 });
  }

  /**
   * Navigate to a URL
   */
  async navigateToUrl(url: string): Promise<void> {
    await this.urlInput.waitForDisplayed({ timeout: 10000 });
    await this.urlInput.setValue(url);
    await this.goButton.click();
  }

  /**
   * Open a DApp URL and wait for webview
   */
  async openDApp(url: string): Promise<void> {
    await this.navigateToUrl(url);
    await waitForWebviewContext(30000);
  }

  /**
   * Go back in browser history
   */
  async goBack(): Promise<void> {
    await this.backButton.click();
  }

  // WebView actions

  /**
   * Switch to the webview context
   */
  async switchToWebview(): Promise<string | null> {
    return await switchToWebviewContext();
  }

  /**
   * Switch back to native context
   */
  async switchToNative(): Promise<void> {
    await switchToNativeContext();
  }

  /**
   * Check if wallet adapter is injected
   */
  async hasWalletAdapter(): Promise<boolean> {
    return await isWalletAdapterInjected();
  }

  /**
   * Get current webview URL
   */
  async getCurrentUrl(): Promise<string> {
    return await getWebviewUrl();
  }

  /**
   * Execute JavaScript in webview
   */
  async executeScript<T>(script: string | (() => T)): Promise<T> {
    return await executeInWebview<T>(script);
  }

  // Connection actions

  /**
   * Trigger wallet connection from DApp side
   */
  async triggerConnect(): Promise<void> {
    await switchToWebviewContext();
    await browser.execute(() => {
      const wallet = (window as { midenWallet?: { connect: () => void } }).midenWallet;
      if (wallet) {
        wallet.connect();
      }
    });
    await switchToNativeContext();
  }

  /**
   * Approve connection request
   */
  async approveConnection(): Promise<void> {
    await this.approveConnectionButton.waitForDisplayed({ timeout: 10000 });
    await this.approveConnectionButton.click();
  }

  /**
   * Reject connection request
   */
  async rejectConnection(): Promise<void> {
    await this.rejectConnectionButton.waitForDisplayed({ timeout: 10000 });
    await this.rejectConnectionButton.click();
  }

  /**
   * Full connection flow
   */
  async connectToDApp(url: string): Promise<void> {
    await this.openDApp(url);
    await this.triggerConnect();
    await this.approveConnection();
  }

  // Transaction actions

  /**
   * Check if transaction confirmation overlay is visible
   */
  async isTransactionOverlayVisible(): Promise<boolean> {
    try {
      return await this.transactionOverlay.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Confirm a transaction
   */
  async confirmTransaction(): Promise<void> {
    await this.confirmTransactionButton.waitForDisplayed({ timeout: 10000 });
    await this.confirmTransactionButton.click();
  }

  /**
   * Reject a transaction
   */
  async rejectTransaction(): Promise<void> {
    await this.rejectTransactionButton.waitForDisplayed({ timeout: 10000 });
    await this.rejectTransactionButton.click();
  }

  // Verification helpers

  /**
   * Check if on browser screen
   */
  async isOnBrowserScreen(): Promise<boolean> {
    try {
      return await this.urlInput.isDisplayed();
    } catch {
      return false;
    }
  }

  /**
   * Wait for page to load in webview
   */
  async waitForPageLoad(timeout: number = 30000): Promise<void> {
    await waitForWebviewContext(timeout);
    await switchToWebviewContext();

    // Wait for document ready state
    await browser.waitUntil(
      async () => {
        const readyState = await browser.execute(() => document.readyState);
        return readyState === 'complete';
      },
      { timeout, timeoutMsg: 'Page did not load within timeout' }
    );

    await switchToNativeContext();
  }

  /**
   * Get wallet adapter info from webview
   */
  async getWalletAdapterInfo(): Promise<{
    isInjected: boolean;
    methods: string[];
  }> {
    await switchToWebviewContext();

    const info = await browser.execute(() => {
      const wallet = (window as { midenWallet?: Record<string, unknown> }).midenWallet;
      if (!wallet) {
        return { isInjected: false, methods: [] };
      }

      const methods = Object.keys(wallet).filter(key => typeof wallet[key] === 'function');

      return { isInjected: true, methods };
    });

    await switchToNativeContext();

    return info;
  }
}

export default new BrowserPage();
