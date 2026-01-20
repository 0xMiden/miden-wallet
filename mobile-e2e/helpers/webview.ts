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
 *
 * The ToggleSwitch component uses an invisible checkbox input for click handling
 * with name="enableBiometric"
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
    // Find the biometric toggle checkbox by name
    const biometricCheckbox = document.querySelector(
      'input[type="checkbox"][name="enableBiometric"]'
    ) as HTMLInputElement;

    if (biometricCheckbox && biometricCheckbox.checked) {
      // Click to uncheck
      biometricCheckbox.click();
      return true;
    }

    // Fallback: find any checked checkbox in the biometric section
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (const checkbox of checkboxes) {
      const input = checkbox as HTMLInputElement;
      if (input.checked) {
        // Check if it's near biometric text
        const parent = input.closest('div');
        const section = parent?.closest('div.bg-grey-50') || parent?.closest('[class*="rounded-lg"]');
        if (section) {
          const sectionText = section.textContent?.toLowerCase() || '';
          if (sectionText.includes('face id') || sectionText.includes('biometric')) {
            input.click();
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
 * Set unlock password input via WebView JavaScript
 * For the lock screen which has only one password input
 */
export async function setUnlockPasswordInput(password: string): Promise<boolean> {
  const currentContext = await getCurrentContext();
  const isInWebview = currentContext.includes('WEBVIEW');

  if (!isInWebview) {
    const switched = await switchToWebviewContext();
    if (!switched) {
      throw new Error('Failed to switch to WebView context');
    }
  }

  const result = await browser.execute((pwd: string) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    )?.set;

    // Find password input on unlock screen
    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
    if (!input) {
      console.error('Could not find password input');
      return false;
    }

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, pwd);
    } else {
      input.value = pwd;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    return true;
  }, password);

  if (!isInWebview) {
    await switchToNativeContext();
  }

  return result as boolean;
}

/**
 * Set all seed phrase inputs by index (0-11)
 * Uses data-testid pattern: seed-phrase-input-{index}
 */
/**
 * Click a link element via WebView JavaScript
 * This is needed on iOS where Link components have accessible="false"
 * and cannot be clicked via native Appium interactions.
 *
 * @param textContent - The text content to match (partial match)
 * @param href - Optional href to match exactly
 */
export async function clickLinkViaJS(textContent: string, href?: string): Promise<boolean> {
  const currentContext = await getCurrentContext();
  const isInWebview = currentContext.includes('WEBVIEW');

  if (!isInWebview) {
    const switched = await switchToWebviewContext();
    if (!switched) {
      throw new Error('Failed to switch to WebView context');
    }
  }

  const result = await browser.execute(
    (text: string, hrefPattern: string | undefined) => {
      // First try to find by href if provided
      if (hrefPattern) {
        const linkByHref = document.querySelector(`a[href="${hrefPattern}"]`) as HTMLElement;
        if (linkByHref) {
          linkByHref.click();
          return true;
        }
      }

      // Fall back to finding by text content
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.textContent?.includes(text)) {
          (link as HTMLElement).click();
          return true;
        }
      }

      // Try buttons if no link found
      const buttons = document.querySelectorAll('button');
      for (const button of buttons) {
        if (button.textContent?.includes(text)) {
          button.click();
          return true;
        }
      }

      return false;
    },
    textContent,
    href
  );

  // Wait for navigation
  await browser.pause(500);

  if (!isInWebview) {
    await switchToNativeContext();
  }

  return result as boolean;
}

/**
 * Check if we're running on iOS
 */
export function isIOSPlatform(): boolean {
  // @ts-expect-error - driver is global in wdio
  return typeof driver !== 'undefined' && driver.isIOS;
}

/**
 * Click on a navigation link (Send, Receive, etc.) from the Explore page
 * On iOS, uses WebView JS click because Link components have accessible="false"
 * On Android, uses native click
 *
 * @param linkText - The text of the link (e.g., "Send", "Receive")
 * @param href - Optional href path (e.g., "/send", "/receive")
 */
export async function clickExploreLink(linkText: string, href?: string): Promise<void> {
  if (isIOSPlatform()) {
    // iOS: Use WebView JS click
    const clicked = await clickLinkViaJS(linkText, href);
    if (!clicked) {
      throw new Error(`Failed to click link "${linkText}" via JS`);
    }
    // Extra wait for iOS navigation
    await browser.pause(1000);
  } else {
    // Android: Use native click
    const button = await $(`//*[contains(@text, "${linkText}")]`);
    await button.waitForDisplayed({ timeout: 15000 });
    await button.click();
  }
}

/**
 * Get the coordinates of an element containing the specified text
 * Returns center coordinates for native tap
 */
export async function getElementCoordinatesByText(
  textContent: string
): Promise<{ x: number; y: number } | null> {
  const currentContext = await getCurrentContext();
  const isInWebview = currentContext.includes('WEBVIEW');

  if (!isInWebview) {
    const switched = await switchToWebviewContext();
    if (!switched) {
      return null;
    }
  }

  const result = await browser.execute((text: string) => {
    // Find element containing the text
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.textContent?.includes(text)) {
        // Walk up the DOM tree to find a clickable container
        let current: HTMLElement | null = el as HTMLElement;
        while (current && current !== document.body) {
          const classes = current.className || '';
          if (classes.includes('cursor-pointer') || classes.includes('hover:bg-grey')) {
            const rect = current.getBoundingClientRect();
            return {
              x: Math.round(rect.left + rect.width / 2),
              y: Math.round(rect.top + rect.height / 2),
              found: true
            };
          }
          current = current.parentElement;
        }
      }
    }
    return { found: false };
  }, textContent);

  if (!isInWebview) {
    await switchToNativeContext();
  }

  if ((result as { found: boolean }).found) {
    return { x: (result as { x: number }).x, y: (result as { y: number }).y };
  }
  return null;
}

/**
 * Click an element by its text content via WebView JavaScript
 * Useful for clicking buttons and other interactive elements that have
 * accessibility issues on iOS.
 *
 * @param textContent - The text content to match (partial match)
 */
export async function clickElementByTextViaJS(textContent: string): Promise<boolean> {
  const currentContext = await getCurrentContext();
  const isInWebview = currentContext.includes('WEBVIEW');

  if (!isInWebview) {
    const switched = await switchToWebviewContext();
    if (!switched) {
      throw new Error('Failed to switch to WebView context');
    }
  }

  const result = await browser.execute((text: string) => {
    // Helper to simulate full click with touch events for mobile
    const simulateClick = (element: HTMLElement): void => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Try touch events first (for mobile)
      if ('ontouchstart' in window) {
        const touchStart = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          view: window,
          touches: [
            new Touch({
              identifier: 0,
              target: element,
              clientX: centerX,
              clientY: centerY
            })
          ]
        });
        const touchEnd = new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          view: window,
          touches: []
        });
        element.dispatchEvent(touchStart);
        element.dispatchEvent(touchEnd);
      }

      // Also dispatch mouse/click events
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: centerX,
        clientY: centerY
      });
      element.dispatchEvent(clickEvent);
    };

    // Try all clickable elements first
    const clickableElements = document.querySelectorAll('button, a, [role="button"]');
    for (const el of clickableElements) {
      if (el.textContent?.includes(text)) {
        simulateClick(el as HTMLElement);
        return { success: true, method: 'clickable-element' };
      }
    }

    // Find element containing the text
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      // Check if element's text content contains the search text
      if (el.textContent?.includes(text)) {
        // Walk up the DOM tree to find a clickable container
        // React CardItem pattern: div with cursor-pointer class has the onClick
        let current: HTMLElement | null = el as HTMLElement;
        while (current && current !== document.body) {
          const classes = current.className || '';
          // Check for cursor-pointer or hover:bg-grey classes (CardItem pattern)
          if (
            classes.includes('cursor-pointer') ||
            classes.includes('hover:bg-grey')
          ) {
            simulateClick(current);
            return { success: true, method: 'cursor-pointer-parent', classes };
          }
          current = current.parentElement;
        }
      }
    }

    // Fall back to finding element with exact match and clicking it
    for (const el of allElements) {
      if (el.textContent?.trim() === text) {
        simulateClick(el as HTMLElement);
        return { success: true, method: 'exact-match-fallback' };
      }
    }

    return { success: false };
  }, textContent);

  console.log('clickElementByTextViaJS result:', result);

  await browser.pause(500);

  if (!isInWebview) {
    await switchToNativeContext();
  }

  return (result as { success: boolean }).success;
}

/**
 * Navigate to home page via WebView JavaScript
 * Uses window.location to go directly to the home route
 */
export async function navigateToHomeViaJS(): Promise<void> {
  const currentContext = await getCurrentContext();
  const isInWebview = currentContext.includes('WEBVIEW');

  if (!isInWebview) {
    const switched = await switchToWebviewContext();
    if (!switched) {
      throw new Error('Failed to switch to WebView context');
    }
  }

  await browser.execute(() => {
    // Navigate to home by changing the hash
    window.location.hash = '#/';
  });

  await browser.pause(1000);

  if (!isInWebview) {
    await switchToNativeContext();
  }
}

/**
 * Click the close/back button via WebView JavaScript
 * Looks for buttons with aria-label="Close" or "Go back"
 */
export async function clickCloseButtonViaJS(): Promise<boolean> {
  const currentContext = await getCurrentContext();
  const isInWebview = currentContext.includes('WEBVIEW');

  if (!isInWebview) {
    const switched = await switchToWebviewContext();
    if (!switched) {
      throw new Error('Failed to switch to WebView context');
    }
  }

  const result = await browser.execute(() => {
    // Try aria-label="Close"
    let closeButton = document.querySelector('[aria-label="Close"]') as HTMLElement;
    if (closeButton) {
      closeButton.click();
      return true;
    }

    // Try aria-label="Go back"
    closeButton = document.querySelector('[aria-label="Go back"]') as HTMLElement;
    if (closeButton) {
      closeButton.click();
      return true;
    }

    // Try data-testid="nav-close"
    closeButton = document.querySelector('[data-testid="nav-close"]') as HTMLElement;
    if (closeButton) {
      closeButton.click();
      return true;
    }

    return false;
  });

  await browser.pause(500);

  if (!isInWebview) {
    await switchToNativeContext();
  }

  return result as boolean;
}

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
