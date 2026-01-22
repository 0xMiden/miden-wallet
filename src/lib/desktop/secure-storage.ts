/**
 * Hardware-backed secure storage for desktop app (Tauri)
 *
 * Provides hardware security using:
 * - macOS: Secure Enclave (Touch ID)
 * - Windows: TPM 2.0 (Windows Hello)
 *
 * The hardware key is used to encrypt the vault key, which in turn
 * encrypts all wallet data. This provides defense-in-depth:
 * - Even if encrypted data is stolen from disk, it cannot be decrypted
 *   without the hardware key (which requires biometric authentication)
 * - The hardware key never leaves the Secure Enclave/TPM chip
 *
 * IMPORTANT: Only import this module when running in a Tauri context.
 * Use `isDesktop()` from 'lib/platform' to check before importing.
 */

import { isDesktop } from 'lib/platform';

// Lazy import Tauri invoke to avoid issues in non-Tauri environments
let tauriInvoke: typeof import('@tauri-apps/api/core').invoke | null = null;

async function getInvoke() {
  if (!tauriInvoke) {
    if (!isDesktop()) {
      throw new Error('Secure storage operations are only available in desktop app');
    }
    const { invoke } = await import('@tauri-apps/api/core');
    tauriInvoke = invoke;
  }
  return tauriInvoke;
}

/**
 * Check if hardware security is available on this platform
 *
 * Returns true on macOS (with Secure Enclave) and Windows (with TPM)
 */
export async function isHardwareSecurityAvailable(): Promise<boolean> {
  if (!isDesktop()) {
    return false;
  }

  try {
    const invoke = await getInvoke();
    return invoke<boolean>('is_hardware_security_available');
  } catch {
    return false;
  }
}

/**
 * Check if a hardware key has already been generated
 *
 * This does NOT trigger biometric authentication - it just checks
 * if a key exists in the Secure Enclave/TPM.
 */
export async function hasHardwareKey(): Promise<boolean> {
  const invoke = await getInvoke();
  return invoke<boolean>('has_hardware_key');
}

/**
 * Generate a new hardware-backed key
 *
 * On macOS: Creates an EC P-256 key pair in the Secure Enclave
 * On Windows: Creates a key in the TPM
 *
 * The key is protected by biometric authentication - any use of the
 * key will require Touch ID / Windows Hello.
 *
 * This may prompt for biometric enrollment if not already set up.
 */
export async function generateHardwareKey(): Promise<void> {
  const invoke = await getInvoke();
  await invoke('generate_hardware_key');
}

/**
 * Encrypt data using the hardware-backed key
 *
 * This will trigger biometric authentication (Touch ID / Windows Hello).
 *
 * The encryption uses ECIES (Elliptic Curve Integrated Encryption Scheme):
 * 1. Generate ephemeral key pair
 * 2. ECDH with hardware key to derive shared secret
 * 3. Derive AES-256 key from shared secret
 * 4. Encrypt with AES-GCM
 *
 * @param data - The data to encrypt (will be treated as UTF-8 string)
 * @returns Base64-encoded encrypted data
 */
export async function encryptWithHardwareKey(data: string): Promise<string> {
  const invoke = await getInvoke();
  return invoke<string>('encrypt_with_hardware_key', { data });
}

/**
 * Decrypt data using the hardware-backed key
 *
 * This will trigger biometric authentication (Touch ID / Windows Hello).
 * If the user cancels authentication, this will throw an error.
 *
 * @param encrypted - Base64-encoded encrypted data from encryptWithHardwareKey
 * @returns The decrypted data as a string
 */
export async function decryptWithHardwareKey(encrypted: string): Promise<string> {
  const invoke = await getInvoke();
  return invoke<string>('decrypt_with_hardware_key', { encrypted });
}

/**
 * Delete the hardware-backed key
 *
 * This removes the key from the Secure Enclave/TPM. After this,
 * any data encrypted with the key cannot be decrypted.
 *
 * Used when:
 * - User resets their wallet
 * - User disables biometric unlock
 */
export async function deleteHardwareKey(): Promise<void> {
  const invoke = await getInvoke();
  await invoke('delete_hardware_key');
}

/**
 * Log a message from JavaScript to Rust's stdout
 *
 * Use this for debugging since webview console.log isn't visible
 * in the Tauri terminal.
 */
export async function tauriLog(message: string): Promise<void> {
  try {
    const invoke = await getInvoke();
    await invoke('js_log', { message });
  } catch {
    // Fallback to console.log if Tauri isn't available
    console.log(message);
  }
}
