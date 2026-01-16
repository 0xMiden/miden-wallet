/**
 * Platform detection utilities for cross-platform code sharing
 * between browser extension and mobile app.
 *
 * Note: Capacitor is imported lazily to avoid 'window is not defined'
 * errors in service worker contexts.
 */

export type PlatformType = 'extension' | 'mobile' | 'web';

// Lazy-load Capacitor to avoid issues in service workers
let _capacitor: typeof import('@capacitor/core').Capacitor | null = null;

function getCapacitor(): typeof import('@capacitor/core').Capacitor | null {
  if (_capacitor === null) {
    try {
      // Only import Capacitor if window exists (not in service worker)
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        _capacitor = require('@capacitor/core').Capacitor;
      }
    } catch {
      _capacitor = null;
    }
  }
  return _capacitor;
}

/**
 * Detects if running in a Capacitor native app (iOS/Android)
 */
export function isCapacitor(): boolean {
  const capacitor = getCapacitor();
  return capacitor?.isNativePlatform() ?? false;
}

/**
 * Detects if running in a browser extension context
 */
export function isExtension(): boolean {
  return typeof browser !== 'undefined' && !!browser?.runtime?.id;
}

/**
 * Detects if running on iOS
 */
export function isIOS(): boolean {
  const capacitor = getCapacitor();
  return capacitor?.getPlatform() === 'ios';
}

/**
 * Detects if running on Android
 */
export function isAndroid(): boolean {
  const capacitor = getCapacitor();
  return capacitor?.getPlatform() === 'android';
}

/**
 * Detects if running on mobile (iOS or Android)
 */
export function isMobile(): boolean {
  return isCapacitor();
}

/**
 * Gets the current platform type
 */
export function getPlatform(): PlatformType {
  if (isCapacitor()) {
    return 'mobile';
  }
  if (isExtension()) {
    return 'extension';
  }
  return 'web';
}

/**
 * Platform object for convenient access to all detection functions
 */
export const platform = {
  isCapacitor,
  isExtension,
  isIOS,
  isAndroid,
  isMobile,
  getPlatform
};

export default platform;
