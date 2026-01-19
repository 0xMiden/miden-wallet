/**
 * Platform detection utilities for cross-platform code sharing
 * between browser extension and mobile app.
 *
 * IMPORTANT: This file is imported by service worker code (background.js).
 * Service workers don't have `window`, so we must check for it before
 * doing anything that requires window or Capacitor.
 */

export type PlatformType = 'extension' | 'mobile' | 'web';

// Lazy-load Capacitor to avoid issues in service workers
let _capacitor: typeof import('@capacitor/core').Capacitor | null = null;
let _capacitorChecked = false;

function getCapacitor(): typeof import('@capacitor/core').Capacitor | null {
  if (!_capacitorChecked) {
    _capacitorChecked = true;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browserGlobal = (globalThis as any).browser;
  return typeof browserGlobal !== 'undefined' && !!browserGlobal?.runtime?.id;
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
