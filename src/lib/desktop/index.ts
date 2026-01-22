/**
 * Desktop-specific utilities for Tauri desktop app
 *
 * IMPORTANT: Only import from this module when running in a Tauri context.
 * Use `isDesktop()` from 'lib/platform' to check before importing.
 */

export {
  isHardwareSecurityAvailable,
  hasHardwareKey,
  generateHardwareKey,
  encryptWithHardwareKey,
  decryptWithHardwareKey,
  deleteHardwareKey
} from './secure-storage';
