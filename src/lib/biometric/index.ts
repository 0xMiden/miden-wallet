/**
 * Biometric authentication service for mobile app.
 *
 * This module provides a cross-platform abstraction for biometric authentication
 * (Face ID, Touch ID, fingerprint) and secure credential storage using the
 * device's hardware-backed keystore (iOS Secure Enclave / Android Keystore).
 *
 * The credentials are encrypted with a key that requires biometric authentication
 * to access, providing hardware-level security for the vault decryption key.
 */

import { isMobile } from 'lib/platform';

// Storage key for biometric-protected vault credential
const BIOMETRIC_CREDENTIAL_KEY = 'vault_biometric_key';
// Storage key for biometric enabled preference
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

// Lazy-load the plugin to avoid issues in non-mobile contexts
let _nativeBiometricModule: typeof import('capacitor-native-biometric') | null = null;
let _biometricChecked = false;

function getNativeBiometricModule(): typeof import('capacitor-native-biometric') | null {
  if (!_biometricChecked) {
    _biometricChecked = true;
    console.log('[Biometric] getNativeBiometricModule called, isMobile:', isMobile());
    if (isMobile() && typeof window !== 'undefined') {
      try {
        // Use require instead of dynamic import to avoid issues in Chrome extension
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        _nativeBiometricModule = require('capacitor-native-biometric');
        console.log('[Biometric] NativeBiometric module loaded successfully');
      } catch (err) {
        console.error('[Biometric] Failed to load NativeBiometric:', err);
        _nativeBiometricModule = null;
      }
    }
  }
  return _nativeBiometricModule;
}

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: 'face' | 'fingerprint' | 'iris' | 'multiple' | 'none';
  errorCode?: number;
  errorMessage?: string;
}

/**
 * Check if biometric authentication is available on the device.
 * Returns information about the type of biometric hardware available.
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  console.log('[Biometric] checkBiometricAvailability called');
  const module = getNativeBiometricModule();

  if (!module) {
    console.log('[Biometric] NativeBiometric module is null');
    return {
      isAvailable: false,
      biometryType: 'none',
      errorMessage: 'Biometric plugin not available'
    };
  }

  try {
    console.log('[Biometric] Calling NativeBiometric.isAvailable()');
    const result = await module.NativeBiometric.isAvailable();
    console.log('[Biometric] isAvailable result:', JSON.stringify(result));
    let biometryType: BiometricAvailability['biometryType'] = 'none';

    // BiometryType enum from capacitor-native-biometric:
    // 1 = TOUCH_ID/FINGERPRINT, 2 = FACE_ID, 3 = IRIS, 4 = MULTIPLE
    switch (result.biometryType) {
      case 1:
        biometryType = 'fingerprint';
        break;
      case 2:
        biometryType = 'face';
        break;
      case 3:
        biometryType = 'iris';
        break;
      case 4:
        biometryType = 'multiple';
        break;
      default:
        biometryType = 'none';
    }

    return {
      isAvailable: result.isAvailable,
      biometryType,
      errorCode: result.errorCode
    };
  } catch (error: any) {
    console.error('[Biometric] Error in isAvailable:', error);
    return {
      isAvailable: false,
      biometryType: 'none',
      errorMessage: error.message || 'Failed to check biometric availability'
    };
  }
}

/**
 * Prompt the user for biometric authentication.
 * Returns true if authentication was successful, false otherwise.
 *
 * @param reason - The reason to display to the user (e.g., "Unlock your wallet")
 */
export async function authenticate(reason: string): Promise<boolean> {
  const module = getNativeBiometricModule();

  if (!module) {
    return false;
  }

  try {
    await module.NativeBiometric.verifyIdentity({
      reason,
      title: 'Miden Wallet',
      subtitle: reason,
      description: '',
      useFallback: true,
      fallbackTitle: 'Use Password'
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Store a credential (e.g., vault decryption key) in the secure keystore.
 * The credential is protected by biometric authentication - it can only be
 * retrieved after successful biometric verification.
 *
 * @param value - The credential value to store (typically the password or derived key)
 */
export async function storeCredential(value: string): Promise<void> {
  const module = getNativeBiometricModule();

  if (!module) {
    throw new Error('Biometric plugin not available');
  }

  await module.NativeBiometric.setCredentials({
    username: BIOMETRIC_CREDENTIAL_KEY,
    password: value,
    server: 'miden.wallet.biometric'
  });
}

/**
 * Retrieve a stored credential from the secure keystore.
 * This will trigger biometric authentication before returning the credential.
 *
 * @returns The stored credential value, or null if not found or authentication failed
 */
export async function getCredential(): Promise<string | null> {
  const module = getNativeBiometricModule();

  if (!module) {
    return null;
  }

  try {
    const credentials = await module.NativeBiometric.getCredentials({
      server: 'miden.wallet.biometric'
    });
    return credentials.password;
  } catch {
    return null;
  }
}

/**
 * Delete the stored credential from the secure keystore.
 * Call this when the user disables biometric unlock or resets the wallet.
 */
export async function deleteCredential(): Promise<void> {
  const module = getNativeBiometricModule();

  if (!module) {
    return;
  }

  try {
    await module.NativeBiometric.deleteCredentials({
      server: 'miden.wallet.biometric'
    });
  } catch {
    // Ignore errors when deleting (credential may not exist)
  }
}

/**
 * Check if biometric unlock is enabled for this wallet.
 */
export async function isBiometricEnabled(): Promise<boolean> {
  if (!isMobile()) {
    return false;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Preferences } = require('@capacitor/preferences');
    const result = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
    console.log('[Biometric] isBiometricEnabled result:', JSON.stringify(result), 'value:', result.value);
    return result.value === 'true';
  } catch (error) {
    console.error('[Biometric] isBiometricEnabled error:', error);
    return false;
  }
}

/**
 * Enable or disable biometric unlock.
 * When enabling, make sure to call storeCredential first with the vault password.
 *
 * @param enabled - Whether biometric unlock should be enabled
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  console.log('[Biometric] setBiometricEnabled called with:', enabled);
  if (!isMobile()) {
    console.log('[Biometric] setBiometricEnabled: not mobile, returning');
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Preferences } = require('@capacitor/preferences');
    const valueToSet = enabled ? 'true' : 'false';
    console.log('[Biometric] setBiometricEnabled: about to set key:', BIOMETRIC_ENABLED_KEY, 'value:', valueToSet);
    await Preferences.set({
      key: BIOMETRIC_ENABLED_KEY,
      value: valueToSet
    });
    console.log('[Biometric] setBiometricEnabled: set completed');

    // Verify the preference was actually written
    const verification = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
    console.log('[Biometric] setBiometricEnabled: verification read:', JSON.stringify(verification));

    if (verification.value !== valueToSet) {
      console.error('[Biometric] setBiometricEnabled: VERIFICATION FAILED! Expected:', valueToSet, 'Got:', verification.value);
    } else {
      console.log('[Biometric] setBiometricEnabled: preference verified successfully');
    }

    // If disabling, also delete the stored credential
    if (!enabled) {
      await deleteCredential();
    }
  } catch (error) {
    console.error('[Biometric] setBiometricEnabled error:', error);
  }
}

/**
 * Attempt to unlock the wallet using biometric authentication.
 * This combines authentication and credential retrieval in a single flow.
 *
 * @param reason - The reason to display to the user
 * @returns The stored password if successful, null otherwise
 */
export async function unlockWithBiometric(reason: string): Promise<string | null> {
  const module = getNativeBiometricModule();

  if (!module) {
    return null;
  }

  try {
    // First verify identity
    await module.NativeBiometric.verifyIdentity({
      reason,
      title: 'Miden Wallet',
      subtitle: reason,
      description: '',
      useFallback: false
    });

    // Then get the stored credential
    const credentials = await module.NativeBiometric.getCredentials({
      server: 'miden.wallet.biometric'
    });

    return credentials.password;
  } catch {
    return null;
  }
}

/**
 * Set up biometric authentication for a wallet.
 * This should be called after the user creates or imports a wallet,
 * storing the password for future biometric unlocks.
 *
 * @param password - The wallet password to store for biometric unlock
 * @returns true if setup was successful, false otherwise
 */
export async function setupBiometric(password: string): Promise<boolean> {
  try {
    // Check availability first
    const availability = await checkBiometricAvailability();
    if (!availability.isAvailable) {
      return false;
    }

    // Authenticate to confirm user identity
    const authenticated = await authenticate('Set up biometric unlock');
    if (!authenticated) {
      return false;
    }

    // Store the credential
    await storeCredential(password);

    // Enable biometric unlock
    await setBiometricEnabled(true);

    return true;
  } catch (error) {
    console.error('Failed to setup biometric:', error);
    return false;
  }
}

export const biometricService = {
  checkBiometricAvailability,
  authenticate,
  storeCredential,
  getCredential,
  deleteCredential,
  isBiometricEnabled,
  setBiometricEnabled,
  unlockWithBiometric,
  setupBiometric
};

export default biometricService;
