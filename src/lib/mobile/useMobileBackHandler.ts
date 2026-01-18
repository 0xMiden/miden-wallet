import { useEffect } from 'react';

import { isMobile } from 'lib/platform';

import { registerMobileBackHandler } from './back-handler';

/**
 * React hook to register a mobile back button handler.
 *
 * The handler is automatically registered on mount and unregistered on unmount.
 * Handlers are called in reverse order (most recently registered first).
 *
 * @param handler - Function that returns true if it handled the back press
 * @param deps - Dependency array (like useEffect)
 *
 * @example
 * ```typescript
 * useMobileBackHandler(() => {
 *   if (cardStack.length > 1) {
 *     goBack();
 *     return true; // Consumed
 *   }
 *   return false; // Pass to next handler
 * }, [cardStack.length, goBack]);
 * ```
 */
export function useMobileBackHandler(
  handler: () => boolean | void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps: any[]
): void {
  useEffect(() => {
    if (!isMobile()) {
      return;
    }

    const unregister = registerMobileBackHandler(handler);
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
