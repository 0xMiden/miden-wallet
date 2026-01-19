/**
 * WebView helpers for DApp browser e2e tests
 *
 * The DApp browser uses @capgo/inappbrowser WebView with injected wallet adapter.
 * Testing requires switching between NATIVE_APP and WEBVIEW contexts.
 */

import { Selectors } from './selectors';

/**
 * Available context types
 */
export type ContextType = 'NATIVE_APP' | string;

/**
 * Get context id from a context (handles both string and object forms)
 */
function getContextId(ctx: unknown): string {
  if (typeof ctx === 'string') {
    return ctx;
  }
  if (ctx && typeof ctx === 'object' && 'id' in ctx) {
    return (ctx as { id: string }).id;
  }
  return '';
}

/**
 * Get all available contexts as string IDs
 */
export async function getContexts(): Promise<string[]> {
  const contexts = await driver.getContexts();
  return contexts.map((ctx) => getContextId(ctx));
}

/**
 * Get the current context as string ID
 */
export async function getCurrentContext(): Promise<string> {
  const ctx = await driver.getContext();
  return getContextId(ctx);
}

/**
 * Switch to native app context
 */
export async function switchToNativeContext(): Promise<void> {
  await driver.switchContext('NATIVE_APP');
}

/**
 * Switch to webview context
 * Returns the webview context name if found, null otherwise
 */
export async function switchToWebviewContext(): Promise<string | null> {
  const contexts = await getContexts();
  const webviewContext = contexts.find((ctx) => ctx.includes('WEBVIEW'));

  if (webviewContext) {
    await driver.switchContext(webviewContext);
    return webviewContext;
  }

  return null;
}

/**
 * Wait for webview context to be available
 */
export async function waitForWebviewContext(timeout: number = 30000): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const contexts = await getContexts();
    const webviewContext = contexts.find((ctx) => ctx.includes('WEBVIEW'));

    if (webviewContext) {
      return webviewContext;
    }

    await browser.pause(500);
  }

  throw new Error(`WebView context not found within ${timeout}ms`);
}

/**
 * Execute JavaScript in the current webview context
 */
export async function executeInWebview<T>(script: string | ((...args: unknown[]) => T)): Promise<T> {
  const currentContext = await getCurrentContext();
  const isInWebview = currentContext.includes('WEBVIEW');

  if (!isInWebview) {
    await switchToWebviewContext();
  }

  const result = await browser.execute(script);

  if (!isInWebview) {
    await switchToNativeContext();
  }

  return result as T;
}

/**
 * Check if the wallet adapter is injected in the current webview
 */
export async function isWalletAdapterInjected(): Promise<boolean> {
  return await executeInWebview(() => {
    return typeof (window as { midenWallet?: unknown }).midenWallet !== 'undefined';
  });
}

/**
 * Wait for wallet adapter to be injected
 */
export async function waitForWalletAdapter(timeout: number = 10000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const isInjected = await isWalletAdapterInjected();
    if (isInjected) {
      return;
    }
    await browser.pause(500);
  }

  throw new Error(`Wallet adapter not injected within ${timeout}ms`);
}

/**
 * Get the current URL in the webview
 */
export async function getWebviewUrl(): Promise<string> {
  return await executeInWebview(() => window.location.href);
}

/**
 * Navigate to a URL in the DApp browser
 * Assumes we're already in the browser screen
 */
export async function navigateToDApp(url: string): Promise<void> {
  // Switch to native to interact with browser UI
  await switchToNativeContext();

  // Enter URL in browser input
  const urlInput = await $(Selectors.browserUrlInput);
  await urlInput.waitForDisplayed({ timeout: 10000 });
  await urlInput.setValue(url);

  // Click go button
  const goButton = await $(Selectors.browserGoButton);
  await goButton.click();

  // Wait for webview to load
  await waitForWebviewContext();
}

/**
 * Perform a DApp connection flow
 * Assumes we're on a DApp page that has a connect button
 */
export async function performDAppConnect(): Promise<void> {
  // In webview, click connect button (DApp-specific)
  await switchToWebviewContext();

  // Wait for wallet adapter
  await waitForWalletAdapter();

  // Trigger connect (this would be DApp-specific)
  await executeInWebview(async () => {
    const wallet = (window as { midenWallet?: { connect: () => Promise<void> } }).midenWallet;
    if (wallet) {
      await wallet.connect();
    }
  });

  // Switch to native to handle connection approval modal
  await switchToNativeContext();

  // Wait for and approve connection
  const approveButton = await $(Selectors.approveConnectionButton);
  await approveButton.waitForDisplayed({ timeout: 10000 });
  await approveButton.click();
}

/**
 * Helper to run a test that requires webview interaction
 * Handles context switching and cleanup
 */
export async function withWebview<T>(fn: () => Promise<T>): Promise<T> {
  const originalContext = await getCurrentContext();

  try {
    await switchToWebviewContext();
    return await fn();
  } finally {
    if (originalContext === 'NATIVE_APP') {
      await switchToNativeContext();
    } else {
      await driver.switchContext(originalContext);
    }
  }
}

/**
 * Set a React input value by data-testid, properly triggering React events
 * This works around the issue where native Appium typing doesn't trigger React onChange
 */
export async function setReactInputValue(testId: string, value: string): Promise<boolean> {
  return await executeInWebview(() => {
    const input = document.querySelector(`[data-testid="${testId}"]`) as HTMLInputElement;
    if (!input) {
      return false;
    }

    // Set the native value setter to bypass React's synthetic event system
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, value);
    } else {
      input.value = value;
    }

    // Dispatch input event to trigger React's onChange
    const inputEvent = new Event('input', { bubbles: true });
    input.dispatchEvent(inputEvent);

    // Also dispatch change event for good measure
    const changeEvent = new Event('change', { bubbles: true });
    input.dispatchEvent(changeEvent);

    return true;
  });
}

/**
 * Disable biometrics toggle on Create Password screen
 * This avoids Face ID prompts during testing
 */
export async function disableBiometricsToggle(): Promise<boolean> {
  const currentContext = await getCurrentContext();
  const isInWebview = currentContext.includes('WEBVIEW');

  if (!isInWebview) {
    const switched = await switchToWebviewContext();
    if (!switched) {
      throw new Error('Failed to switch to WebView context');
    }
  }

  const result = await browser.execute(() => {
    // Find the biometrics toggle - it's usually a checkbox or switch input
    // Look for inputs with type checkbox or role switch near "Face ID" or "biometric" text
    const toggles = document.querySelectorAll('input[type="checkbox"], [role="switch"]');

    for (const toggle of toggles) {
      const el = toggle as HTMLInputElement;
      // Check if it's checked/enabled and click to disable
      if (el.checked || el.getAttribute('aria-checked') === 'true') {
        el.click();
        return true;
      }
    }

    // Also try finding by looking for Face ID related elements
    const labels = document.querySelectorAll('label, div, span');
    for (const label of labels) {
      if (label.textContent?.toLowerCase().includes('face id') ||
          label.textContent?.toLowerCase().includes('biometric')) {
        // Find nearby toggle
        const parent = label.closest('div');
        if (parent) {
          const toggle = parent.querySelector('input[type="checkbox"], [role="switch"]') as HTMLInputElement;
          if (toggle && (toggle.checked || toggle.getAttribute('aria-checked') === 'true')) {
            toggle.click();
            return true;
          }
        }
      }
    }

    return false;
  });

  if (!isInWebview) {
    await switchToNativeContext();
  }

  return result as boolean;
}

/**
 * Set password inputs via WebView JavaScript
 * Handles both password and confirm password fields
 */
export async function setPasswordInputs(password: string, confirmPassword: string): Promise<boolean> {
  const currentContext = await getCurrentContext();
  const isInWebview = currentContext.includes('WEBVIEW');

  if (!isInWebview) {
    const switched = await switchToWebviewContext();
    if (!switched) {
      throw new Error('Failed to switch to WebView context');
    }
  }

  // Pass passwords as arguments to execute script
  const result = await browser.execute(
    (pwd: string, confirmPwd: string) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      // Find password inputs - they use type="password" or specific ids/testids
      const inputs = document.querySelectorAll('input[type="password"], input[type="text"]');
      const passwordInputs: HTMLInputElement[] = [];

      // Filter to find actual password fields (look for password-related attributes)
      inputs.forEach((input) => {
        const el = input as HTMLInputElement;
        const id = el.id?.toLowerCase() || '';
        const testId = el.getAttribute('data-testid')?.toLowerCase() || '';
        const placeholder = el.placeholder?.toLowerCase() || '';

        if (
          id.includes('password') ||
          testId.includes('password') ||
          placeholder.includes('password') ||
          el.type === 'password'
        ) {
          passwordInputs.push(el);
        }
      });

      if (passwordInputs.length < 2) {
        console.error('Could not find both password inputs, found:', passwordInputs.length);
        return false;
      }

      // Set first password input
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(passwordInputs[0], pwd);
      } else {
        passwordInputs[0].value = pwd;
      }
      passwordInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
      passwordInputs[0].dispatchEvent(new Event('change', { bubbles: true }));

      // Set confirm password input
      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(passwordInputs[1], confirmPwd);
      } else {
        passwordInputs[1].value = confirmPwd;
      }
      passwordInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
      passwordInputs[1].dispatchEvent(new Event('change', { bubbles: true }));

      return true;
    },
    password,
    confirmPassword
  );

  if (!isInWebview) {
    await switchToNativeContext();
  }

  return result as boolean;
}

/**
 * Set all seed phrase inputs by index (0-11)
 * Uses data-testid pattern: seed-phrase-input-{index}
 */
export async function setSeedPhraseInputs(words: string[]): Promise<boolean> {
  const currentContext = await getCurrentContext();
  const isInWebview = currentContext.includes('WEBVIEW');

  if (!isInWebview) {
    const switched = await switchToWebviewContext();
    if (!switched) {
      throw new Error('Failed to switch to WebView context');
    }
  }

  // Pass words as argument to execute script
  const result = await browser.execute((wordsArg: string[]) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;

    for (let i = 0; i < wordsArg.length; i++) {
      const input = document.querySelector(`[data-testid="seed-phrase-input-${i}"]`) as HTMLInputElement;
      if (!input) {
        console.error(`Input not found: seed-phrase-input-${i}`);
        return false;
      }

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(input, wordsArg[i]);
      } else {
        input.value = wordsArg[i];
      }

      // Dispatch events
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    return true;
  }, words);

  if (!isInWebview) {
    await switchToNativeContext();
  }

  return result as boolean;
}
