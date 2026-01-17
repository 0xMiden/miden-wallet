import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

import { isMobile } from 'lib/platform';

/**
 * Haptic feedback utilities for mobile.
 * All functions are safe to call on non-mobile platforms (they no-op).
 */

/**
 * Light impact - for button taps, selections
 */
export const hapticLight = async () => {
  if (!isMobile()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    // Ignore errors on unsupported devices
  }
};

/**
 * Medium impact - for toggles, significant actions
 */
export const hapticMedium = async () => {
  if (!isMobile()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    // Ignore errors on unsupported devices
  }
};

/**
 * Heavy impact - for destructive actions, important confirmations
 */
export const hapticHeavy = async () => {
  if (!isMobile()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch {
    // Ignore errors on unsupported devices
  }
};

/**
 * Success notification - for completed transactions, successful operations
 */
export const hapticSuccess = async () => {
  if (!isMobile()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // Ignore errors on unsupported devices
  }
};

/**
 * Warning notification - for warnings, requires attention
 */
export const hapticWarning = async () => {
  if (!isMobile()) return;
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch {
    // Ignore errors on unsupported devices
  }
};

/**
 * Error notification - for failed operations, errors
 */
export const hapticError = async () => {
  if (!isMobile()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch {
    // Ignore errors on unsupported devices
  }
};

/**
 * Selection changed - for picker changes, list selections
 */
export const hapticSelection = async () => {
  if (!isMobile()) return;
  try {
    await Haptics.selectionChanged();
  } catch {
    // Ignore errors on unsupported devices
  }
};
