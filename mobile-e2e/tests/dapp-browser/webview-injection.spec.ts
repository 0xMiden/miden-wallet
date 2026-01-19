import { ensureWalletReady } from '../../fixtures/wallet';
import { Selectors } from '../../helpers/selectors';
import {
  switchToWebviewContext,
  switchToNativeContext,
  waitForWebviewContext,
  getContexts,
  getCurrentContext,
  isWalletAdapterInjected,
  getWebviewUrl,
  executeInWebview,
} from '../../helpers/webview';

describe('DApp Browser - WebView Injection', () => {
  beforeEach(async () => {
    await ensureWalletReady();
  });

  it('should create WEBVIEW context when loading a page', async () => {
    const browserTab = await $(Selectors.browserTab);
    await browserTab.click();

    const browserUrlInput = await $(Selectors.browserUrlInput);
    await browserUrlInput.waitForDisplayed({ timeout: 15000 });
    await browserUrlInput.setValue('https://example.com');

    const goButton = await $(Selectors.browserGoButton);
    await goButton.click();

    // Wait for webview context to appear
    const webviewContext = await waitForWebviewContext(30000);

    expect(webviewContext).toContain('WEBVIEW');
  });

  it('should have NATIVE_APP and WEBVIEW contexts available', async () => {
    const browserTab = await $(Selectors.browserTab);
    await browserTab.click();

    const browserUrlInput = await $(Selectors.browserUrlInput);
    await browserUrlInput.waitForDisplayed({ timeout: 15000 });
    await browserUrlInput.setValue('https://example.com');

    const goButton = await $(Selectors.browserGoButton);
    await goButton.click();

    await waitForWebviewContext(30000);

    const contexts = await getContexts();

    expect(contexts).toContain('NATIVE_APP');
    expect(contexts.some((ctx) => ctx.includes('WEBVIEW'))).toBe(true);
  });

  it('should inject window.midenWallet into webview', async () => {
    const browserTab = await $(Selectors.browserTab);
    await browserTab.click();

    const browserUrlInput = await $(Selectors.browserUrlInput);
    await browserUrlInput.waitForDisplayed({ timeout: 15000 });
    await browserUrlInput.setValue('https://example.com');

    const goButton = await $(Selectors.browserGoButton);
    await goButton.click();

    await waitForWebviewContext(30000);

    const hasWalletAdapter = await isWalletAdapterInjected();
    expect(hasWalletAdapter).toBe(true);

    await switchToNativeContext();
  });

  it('should provide wallet adapter methods', async () => {
    const browserTab = await $(Selectors.browserTab);
    await browserTab.click();

    const browserUrlInput = await $(Selectors.browserUrlInput);
    await browserUrlInput.waitForDisplayed({ timeout: 15000 });
    await browserUrlInput.setValue('https://example.com');

    const goButton = await $(Selectors.browserGoButton);
    await goButton.click();

    await waitForWebviewContext(30000);
    await switchToWebviewContext();

    // Check for expected wallet adapter methods
    const adapterMethods = await browser.execute(() => {
      const wallet = (window as {
        midenWallet?: {
          connect?: unknown;
          disconnect?: unknown;
          getAccounts?: unknown;
          signTransaction?: unknown;
        };
      }).midenWallet;
      if (!wallet) return [];

      return Object.keys(wallet).filter((key) => typeof (wallet as Record<string, unknown>)[key] === 'function');
    });

    // Should have at least connect method
    expect(adapterMethods).toContain('connect');

    await switchToNativeContext();
  });

  it('should switch between contexts correctly', async () => {
    const browserTab = await $(Selectors.browserTab);
    await browserTab.click();

    const browserUrlInput = await $(Selectors.browserUrlInput);
    await browserUrlInput.waitForDisplayed({ timeout: 15000 });
    await browserUrlInput.setValue('https://example.com');

    const goButton = await $(Selectors.browserGoButton);
    await goButton.click();

    await waitForWebviewContext(30000);

    // Verify initial context
    let currentContext = await getCurrentContext();
    expect(currentContext).toBe('NATIVE_APP');

    // Switch to webview
    await switchToWebviewContext();
    currentContext = await getCurrentContext();
    expect(currentContext).toContain('WEBVIEW');

    // Switch back to native
    await switchToNativeContext();
    currentContext = await getCurrentContext();
    expect(currentContext).toBe('NATIVE_APP');
  });

  it('should be able to read webview URL', async () => {
    const browserTab = await $(Selectors.browserTab);
    await browserTab.click();

    const browserUrlInput = await $(Selectors.browserUrlInput);
    await browserUrlInput.waitForDisplayed({ timeout: 15000 });
    await browserUrlInput.setValue('https://example.com');

    const goButton = await $(Selectors.browserGoButton);
    await goButton.click();

    await waitForWebviewContext(30000);

    const url = await getWebviewUrl();
    expect(url).toContain('example.com');

    await switchToNativeContext();
  });

  it('should execute JavaScript in webview context', async () => {
    const browserTab = await $(Selectors.browserTab);
    await browserTab.click();

    const browserUrlInput = await $(Selectors.browserUrlInput);
    await browserUrlInput.waitForDisplayed({ timeout: 15000 });
    await browserUrlInput.setValue('https://example.com');

    const goButton = await $(Selectors.browserGoButton);
    await goButton.click();

    await waitForWebviewContext(30000);

    // Execute arbitrary JS and verify it works
    const result = await executeInWebview<number>(() => {
      return 1 + 1;
    });

    expect(result).toBe(2);

    await switchToNativeContext();
  });

  it('should maintain wallet adapter across page navigation', async () => {
    const browserTab = await $(Selectors.browserTab);
    await browserTab.click();

    const browserUrlInput = await $(Selectors.browserUrlInput);
    await browserUrlInput.waitForDisplayed({ timeout: 15000 });
    await browserUrlInput.setValue('https://example.com');

    const goButton = await $(Selectors.browserGoButton);
    await goButton.click();

    await waitForWebviewContext(30000);

    // Verify adapter on first page
    let hasAdapter = await isWalletAdapterInjected();
    expect(hasAdapter).toBe(true);

    // Navigate to another page
    await switchToNativeContext();
    await browserUrlInput.setValue('https://www.iana.org');
    await goButton.click();

    // Wait for new page
    await browser.pause(3000);

    // Verify adapter still injected
    hasAdapter = await isWalletAdapterInjected();
    expect(hasAdapter).toBe(true);

    await switchToNativeContext();
  });
});
