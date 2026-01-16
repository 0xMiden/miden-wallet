import { Capacitor } from '@capacitor/core';

/**
 * Platform detection utilities for cross-platform code sharing
 * between browser extension and mobile app.
 */

export type PlatformType = 'extension' | 'mobile' | 'web';

/**
 * Detects if running in a Capacitor native app (iOS/Android)
 */
export function isCapacitor(): boolean {
  return Capacitor.isNativePlatform();
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
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Detects if running on Android
 */
export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
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
