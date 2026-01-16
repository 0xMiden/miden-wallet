/**
 * Platform detection utilities for cross-platform code sharing
 * between browser extension and mobile app.
 *
 * IMPORTANT: This file is imported by service worker code (background.js).
 * Service workers don't have `window`, so we must check for it before
 * doing anything that requires window or Capacitor.
 */

export type PlatformType = 'extension' | 'mobile' | 'web';

// Cache for Capacitor detection result
let _isCapacitorCached: boolean | null = null;
let _capacitorPlatform: string | null = null;

/**
 * Check if we're in a service worker context (no window available)
 */
function isServiceWorker(): boolean {
  return typeof window === 'undefined';
}

/**
 * Detects if running in a Capacitor native app (iOS/Android)
 */
export function isCapacitor(): boolean {
  // Service workers are never in Capacitor context
  if (isServiceWorker()) {
    return false;
  }

  if (_isCapacitorCached === null) {
    try {
      // Check for Capacitor global that's set when running in native app
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cap = (window as any).Capacitor;
      _isCapacitorCached = cap?.isNativePlatform?.() ?? false;
      _capacitorPlatform = cap?.getPlatform?.() ?? null;
    } catch {
      _isCapacitorCached = false;
    }
  }
  return _isCapacitorCached;
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
  if (isServiceWorker()) return false;
  isCapacitor(); // Ensure cache is populated
  return _capacitorPlatform === 'ios';
}

/**
 * Detects if running on Android
 */
export function isAndroid(): boolean {
  if (isServiceWorker()) return false;
  isCapacitor(); // Ensure cache is populated
  return _capacitorPlatform === 'android';
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
