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

export {
  openDappWindow,
  closeDappWindow,
  dappNavigate,
  dappGetUrl,
  onDappWalletRequest,
  onDappWindowClose,
  sendDappWalletResponse
} from './dapp-browser';

export type { DappWalletRequest, DappWalletRequestEvent } from './dapp-browser';

export { DesktopDappHandler, useDesktopDappHandler } from './DesktopDappHandler';
