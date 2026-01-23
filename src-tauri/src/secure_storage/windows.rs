//! Windows TPM 2.0 implementation
//!
//! Uses Windows CNG (Cryptography Next Generation) APIs to store keys in the TPM.
//! Keys are protected by Windows Hello (PIN, fingerprint, or face recognition).
//!
//! Encryption scheme (ECIES):
//! 1. Generate EC P-256 key pair in TPM (private key never leaves TPM)
//! 2. For encryption: Generate ephemeral key (software), ECDH with TPM public key, derive AES key, encrypt
//! 3. For decryption: ECDH with TPM private key (triggers Windows Hello), derive AES key, decrypt

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use log::{info, warn};
use std::ffi::c_void;
use std::ptr;
use windows::core::{w, PCWSTR};
use windows::Win32::Security::Cryptography::{
    BCryptCloseAlgorithmProvider, BCryptCreateHash, BCryptDecrypt, BCryptDestroyHash,
    BCryptDestroyKey, BCryptEncrypt, BCryptExportKey, BCryptFinishHash, BCryptGenRandom,
    BCryptGenerateKeyPair, BCryptGetProperty, BCryptHashData, BCryptImportKeyPair,
    BCryptOpenAlgorithmProvider, BCryptSecretAgreement, BCryptSetProperty,
    NCryptCreatePersistedKey, NCryptDeleteKey, NCryptExportKey, NCryptFinalizeKey,
    NCryptFreeObject, NCryptOpenKey, NCryptOpenStorageProvider, NCryptSecretAgreement,
    NCryptSetProperty, BCRYPT_AES_ALGORITHM, BCRYPT_ALG_HANDLE,
    BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO, BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO_VERSION,
    BCRYPT_CHAINING_MODE, BCRYPT_CHAIN_MODE_GCM, BCRYPT_ECCPUBLIC_BLOB, BCRYPT_ECDH_P256_ALGORITHM,
    BCRYPT_FLAGS, BCRYPT_HASH_HANDLE, BCRYPT_KEY_HANDLE, BCRYPT_OBJECT_LENGTH,
    BCRYPT_OPEN_ALGORITHM_PROVIDER_FLAGS, BCRYPT_SHA256_ALGORITHM, BCRYPTGENRANDOM_FLAGS,
    CERT_KEY_SPEC, MS_KEY_STORAGE_PROVIDER, MS_PLATFORM_CRYPTO_PROVIDER,
    NCRYPT_ECDH_P256_ALGORITHM, NCRYPT_KEY_HANDLE, NCRYPT_PROV_HANDLE, NCRYPT_SECRET_HANDLE,
    NCRYPT_UI_POLICY,
};

// Key name for the TPM-stored key
const KEY_NAME: PCWSTR = w!("MidenWalletVaultKey");

/// Check if TPM is available on this Windows system
pub fn is_hardware_security_available() -> Result<bool, String> {
    info!("Checking Windows TPM availability");

    // Try to open the Platform Crypto Provider (TPM)
    let mut provider: NCRYPT_PROV_HANDLE = NCRYPT_PROV_HANDLE::default();

    let status = unsafe { NCryptOpenStorageProvider(&mut provider, MS_PLATFORM_CRYPTO_PROVIDER, 0) };

    if status.is_err() {
        warn!("TPM not available: {:?}", status);
        return Ok(false);
    }

    // Close the provider
    if !provider.is_invalid() {
        let _ = unsafe { NCryptFreeObject(provider) };
    }

    info!("TPM is available");
    Ok(true)
}

/// Check if we already have a hardware key stored
pub fn has_hardware_key() -> Result<bool, String> {
    match get_tpm_key() {
        Ok(handle) => {
            let _ = unsafe { NCryptFreeObject(handle) };
            Ok(true)
        }
        Err(_) => Ok(false),
    }
}

/// Generate a new key in the TPM with Windows Hello protection
pub fn generate_hardware_key() -> Result<(), String> {
    info!("Generating TPM key with Windows Hello protection");

    // Check if key already exists
    if has_hardware_key().unwrap_or(false) {
        info!("TPM key already exists");
        return Ok(());
    }

    // Open the Platform Crypto Provider (TPM)
    let mut provider: NCRYPT_PROV_HANDLE = NCRYPT_PROV_HANDLE::default();

    let status = unsafe { NCryptOpenStorageProvider(&mut provider, MS_PLATFORM_CRYPTO_PROVIDER, 0) };

    if status.is_err() {
        return Err(format!("Failed to open TPM provider: {:?}", status));
    }

    // Create a persisted ECDH P-256 key
    let mut key_handle: NCRYPT_KEY_HANDLE = NCRYPT_KEY_HANDLE::default();

    let status = unsafe {
        NCryptCreatePersistedKey(
            provider,
            &mut key_handle,
            NCRYPT_ECDH_P256_ALGORITHM,
            KEY_NAME,
            CERT_KEY_SPEC(0),
            Default::default(),
        )
    };

    if status.is_err() {
        let _ = unsafe { NCryptFreeObject(provider) };
        return Err(format!("Failed to create TPM key: {:?}", status));
    }

    // Set UI policy to require Windows Hello authentication
    let ui_policy = NCRYPT_UI_POLICY {
        dwVersion: 1,
        dwFlags: 0x1, // NCRYPT_UI_PROTECT_KEY_FLAG - requires Windows Hello
        pszCreationTitle: PCWSTR::null(),
        pszFriendlyName: PCWSTR::null(),
        pszDescription: PCWSTR::null(),
    };

    let ui_policy_bytes = unsafe {
        std::slice::from_raw_parts(
            &ui_policy as *const _ as *const u8,
            std::mem::size_of::<NCRYPT_UI_POLICY>(),
        )
    };

    let status = unsafe {
        NCryptSetProperty(
            key_handle,
            w!("UI Policy"),
            ui_policy_bytes,
            Default::default(),
        )
    };

    if status.is_err() {
        warn!(
            "Failed to set UI policy (Windows Hello may not be configured): {:?}",
            status
        );
        // Continue anyway - key will work but may not require biometric
    }

    // Finalize the key (makes it usable)
    let status = unsafe { NCryptFinalizeKey(key_handle, Default::default()) };

    if status.is_err() {
        let _ = unsafe { NCryptFreeObject(key_handle) };
        let _ = unsafe { NCryptFreeObject(provider) };
        return Err(format!("Failed to finalize TPM key: {:?}", status));
    }

    // Clean up
    let _ = unsafe { NCryptFreeObject(key_handle) };
    let _ = unsafe { NCryptFreeObject(provider) };

    info!("TPM key generated successfully");
    Ok(())
}

/// Delete the hardware key from TPM
pub fn delete_hardware_key() -> Result<(), String> {
    info!("Deleting TPM key");

    match get_tpm_key() {
        Ok(key_handle) => {
            let status = unsafe { NCryptDeleteKey(key_handle, 0) };
            if status.is_err() {
                return Err(format!("Failed to delete TPM key: {:?}", status));
            }
            info!("TPM key deleted");
            Ok(())
        }
        Err(_) => {
            info!("TPM key not found, nothing to delete");
            Ok(())
        }
    }
}

/// Encrypt data using the TPM key (ECIES scheme)
///
/// This does NOT trigger Windows Hello because we only use the TPM public key.
/// The encryption is done with an ephemeral software key.
pub fn encrypt_with_hardware_key(data: &str) -> Result<String, String> {
    info!("Encrypting with TPM key");

    // Get the TPM key and export its public key
    let tpm_key = get_tpm_key()?;
    let tpm_pubkey_blob = export_tpm_public_key(tpm_key)?;
    let _ = unsafe { NCryptFreeObject(tpm_key) };

    // Generate ephemeral key pair (software) and perform ECDH
    let (ephemeral_pubkey_blob, shared_secret) = ecdh_encrypt_side(&tpm_pubkey_blob)?;

    // Derive AES-256 key from shared secret using SHA-256
    let aes_key = sha256(&shared_secret)?;

    // Encrypt data with AES-GCM
    let plaintext = data.as_bytes();
    let nonce: [u8; 12] = rand_bytes()?;
    let (ciphertext, tag) = aes_gcm_encrypt(&aes_key, &nonce, plaintext)?;

    // Combine: ephemeral_pubkey_len (2 bytes) || ephemeral_pubkey || nonce || ciphertext || tag
    let mut result = Vec::new();
    let pubkey_len = ephemeral_pubkey_blob.len() as u16;
    result.extend_from_slice(&pubkey_len.to_be_bytes());
    result.extend_from_slice(&ephemeral_pubkey_blob);
    result.extend_from_slice(&nonce);
    result.extend_from_slice(&ciphertext);
    result.extend_from_slice(&tag);

    info!("Encryption successful");
    Ok(BASE64.encode(&result))
}

/// Decrypt data using the TPM key (ECIES scheme)
///
/// This WILL trigger Windows Hello authentication because we use the TPM private key.
pub fn decrypt_with_hardware_key(encrypted: &str) -> Result<String, String> {
    info!("Decrypting with TPM key (will prompt for Windows Hello)");

    // Decode base64
    let data = BASE64
        .decode(encrypted)
        .map_err(|e| format!("Invalid base64: {}", e))?;

    if data.len() < 2 {
        return Err("Encrypted data too short".to_string());
    }

    // Parse: ephemeral_pubkey_len (2 bytes) || ephemeral_pubkey || nonce || ciphertext || tag
    let pubkey_len = u16::from_be_bytes([data[0], data[1]]) as usize;

    if data.len() < 2 + pubkey_len + 12 + 16 {
        return Err("Encrypted data too short".to_string());
    }

    let ephemeral_pubkey_blob = &data[2..2 + pubkey_len];
    let nonce = &data[2 + pubkey_len..2 + pubkey_len + 12];
    let ciphertext_and_tag = &data[2 + pubkey_len + 12..];

    if ciphertext_and_tag.len() < 16 {
        return Err("Encrypted data too short for tag".to_string());
    }

    let ciphertext = &ciphertext_and_tag[..ciphertext_and_tag.len() - 16];
    let tag = &ciphertext_and_tag[ciphertext_and_tag.len() - 16..];

    // Get the TPM key and perform ECDH (this triggers Windows Hello!)
    let tpm_key = get_tpm_key()?;
    let shared_secret = ecdh_decrypt_side(tpm_key, ephemeral_pubkey_blob)?;
    let _ = unsafe { NCryptFreeObject(tpm_key) };

    // Derive AES-256 key from shared secret
    let aes_key = sha256(&shared_secret)?;

    // Decrypt with AES-GCM
    let plaintext = aes_gcm_decrypt(&aes_key, nonce, ciphertext, tag)?;

    String::from_utf8(plaintext).map_err(|e| format!("Decrypted data is not valid UTF-8: {}", e))
}

// ============================================================================
// Helper Functions
// ============================================================================

/// Get the existing TPM key handle
fn get_tpm_key() -> Result<NCRYPT_KEY_HANDLE, String> {
    let mut provider: NCRYPT_PROV_HANDLE = NCRYPT_PROV_HANDLE::default();

    let status = unsafe { NCryptOpenStorageProvider(&mut provider, MS_PLATFORM_CRYPTO_PROVIDER, 0) };

    if status.is_err() {
        return Err(format!("Failed to open TPM provider: {:?}", status));
    }

    let mut key_handle: NCRYPT_KEY_HANDLE = NCRYPT_KEY_HANDLE::default();

    let status = unsafe {
        NCryptOpenKey(
            provider,
            &mut key_handle,
            KEY_NAME,
            CERT_KEY_SPEC(0),
            Default::default(),
        )
    };

    let _ = unsafe { NCryptFreeObject(provider) };

    if status.is_err() {
        return Err(format!("TPM key not found: {:?}", status));
    }

    Ok(key_handle)
}

/// Export the public key from a TPM key handle as BCRYPT_ECCPUBLIC_BLOB
fn export_tpm_public_key(key_handle: NCRYPT_KEY_HANDLE) -> Result<Vec<u8>, String> {
    // First call to get the required size
    let mut blob_size: u32 = 0;
    let status = unsafe {
        NCryptExportKey(
            key_handle,
            NCRYPT_KEY_HANDLE::default(),
            BCRYPT_ECCPUBLIC_BLOB,
            None,
            None,
            &mut blob_size,
            Default::default(),
        )
    };

    if status.is_err() {
        return Err(format!("Failed to get TPM public key size: {:?}", status));
    }

    // Second call to get the actual key data
    let mut blob = vec![0u8; blob_size as usize];
    let status = unsafe {
        NCryptExportKey(
            key_handle,
            NCRYPT_KEY_HANDLE::default(),
            BCRYPT_ECCPUBLIC_BLOB,
            None,
            Some(&mut blob),
            &mut blob_size,
            Default::default(),
        )
    };

    if status.is_err() {
        return Err(format!("Failed to export TPM public key: {:?}", status));
    }

    blob.truncate(blob_size as usize);
    Ok(blob)
}

/// ECDH encryption side: generate ephemeral key and compute shared secret
///
/// Uses BCrypt (software) - does not require authentication
fn ecdh_encrypt_side(tpm_pubkey_blob: &[u8]) -> Result<(Vec<u8>, Vec<u8>), String> {
    // Open ECDH P-256 algorithm provider
    let mut alg_handle: BCRYPT_ALG_HANDLE = BCRYPT_ALG_HANDLE::default();

    let status = unsafe {
        BCryptOpenAlgorithmProvider(
            &mut alg_handle,
            BCRYPT_ECDH_P256_ALGORITHM,
            None,
            BCRYPT_OPEN_ALGORITHM_PROVIDER_FLAGS(0),
        )
    };

    if status.is_err() {
        return Err(format!("Failed to open ECDH algorithm: {:?}", status));
    }

    // Generate ephemeral key pair
    let mut ephemeral_key: BCRYPT_KEY_HANDLE = BCRYPT_KEY_HANDLE::default();
    let status = unsafe { BCryptGenerateKeyPair(alg_handle, &mut ephemeral_key, 256, 0) };

    if status.is_err() {
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to generate ephemeral key: {:?}", status));
    }

    // Finalize the ephemeral key
    let status =
        unsafe { windows::Win32::Security::Cryptography::BCryptFinalizeKeyPair(ephemeral_key, 0) };

    if status.is_err() {
        let _ = unsafe { BCryptDestroyKey(ephemeral_key) };
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to finalize ephemeral key: {:?}", status));
    }

    // Export ephemeral public key
    let mut blob_size: u32 = 0;
    let status = unsafe {
        BCryptExportKey(
            ephemeral_key,
            BCRYPT_KEY_HANDLE::default(),
            BCRYPT_ECCPUBLIC_BLOB,
            None,
            &mut blob_size,
            0,
        )
    };

    if status.is_err() {
        let _ = unsafe { BCryptDestroyKey(ephemeral_key) };
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to get ephemeral key size: {:?}", status));
    }

    let mut ephemeral_pubkey_blob = vec![0u8; blob_size as usize];
    let status = unsafe {
        BCryptExportKey(
            ephemeral_key,
            BCRYPT_KEY_HANDLE::default(),
            BCRYPT_ECCPUBLIC_BLOB,
            Some(&mut ephemeral_pubkey_blob),
            &mut blob_size,
            0,
        )
    };

    if status.is_err() {
        let _ = unsafe { BCryptDestroyKey(ephemeral_key) };
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!(
            "Failed to export ephemeral public key: {:?}",
            status
        ));
    }

    ephemeral_pubkey_blob.truncate(blob_size as usize);

    // Import TPM public key into BCrypt for ECDH
    let mut tpm_pubkey_handle: BCRYPT_KEY_HANDLE = BCRYPT_KEY_HANDLE::default();
    let status = unsafe {
        BCryptImportKeyPair(
            alg_handle,
            BCRYPT_KEY_HANDLE::default(),
            BCRYPT_ECCPUBLIC_BLOB,
            &mut tpm_pubkey_handle,
            tpm_pubkey_blob,
            0,
        )
    };

    if status.is_err() {
        let _ = unsafe { BCryptDestroyKey(ephemeral_key) };
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to import TPM public key: {:?}", status));
    }

    // Perform ECDH: ephemeral_private * TPM_public = shared_secret
    let mut secret_handle: windows::Win32::Security::Cryptography::BCRYPT_SECRET_HANDLE =
        windows::Win32::Security::Cryptography::BCRYPT_SECRET_HANDLE::default();
    let status =
        unsafe { BCryptSecretAgreement(ephemeral_key, tpm_pubkey_handle, &mut secret_handle, 0) };

    if status.is_err() {
        let _ = unsafe { BCryptDestroyKey(tpm_pubkey_handle) };
        let _ = unsafe { BCryptDestroyKey(ephemeral_key) };
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to compute ECDH secret: {:?}", status));
    }

    // Derive raw shared secret
    let shared_secret = derive_bcrypt_secret(secret_handle)?;

    // Clean up
    let _ = unsafe { windows::Win32::Security::Cryptography::BCryptDestroySecret(secret_handle) };
    let _ = unsafe { BCryptDestroyKey(tpm_pubkey_handle) };
    let _ = unsafe { BCryptDestroyKey(ephemeral_key) };
    let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };

    Ok((ephemeral_pubkey_blob, shared_secret))
}

/// ECDH decryption side: use TPM private key to compute shared secret
///
/// Uses NCrypt with TPM - TRIGGERS WINDOWS HELLO
fn ecdh_decrypt_side(
    tpm_key: NCRYPT_KEY_HANDLE,
    ephemeral_pubkey_blob: &[u8],
) -> Result<Vec<u8>, String> {
    // Set window handle property on the TPM key so Windows Hello can show its UI.
    // We use GetDesktopWindow() as it always returns a valid handle, unlike
    // GetForegroundWindow() which may return null if no window has focus.
    unsafe {
        let hwnd = windows::Win32::UI::WindowsAndMessaging::GetDesktopWindow();
        if !hwnd.is_invalid() {
            let hwnd_value = hwnd.0 as usize;
            let hwnd_bytes = hwnd_value.to_ne_bytes();
            // Ignore errors - worst case Windows Hello shows without a parent window
            let _ = NCryptSetProperty(tpm_key, w!("HWND Handle"), &hwnd_bytes, Default::default());
        }
    }

    // Use MS_KEY_STORAGE_PROVIDER to import the ephemeral public key
    // (MS_PLATFORM_CRYPTO_PROVIDER doesn't support importing external public keys)
    let mut sw_provider: NCRYPT_PROV_HANDLE = NCRYPT_PROV_HANDLE::default();

    let status =
        unsafe { NCryptOpenStorageProvider(&mut sw_provider, MS_KEY_STORAGE_PROVIDER, 0) };

    if status.is_err() {
        return Err(format!("Failed to open software provider: {:?}", status));
    }

    // Import ephemeral public key
    let mut ephemeral_ncrypt_key: NCRYPT_KEY_HANDLE = NCRYPT_KEY_HANDLE::default();

    let status = unsafe {
        windows::Win32::Security::Cryptography::NCryptImportKey(
            sw_provider,
            NCRYPT_KEY_HANDLE::default(),
            BCRYPT_ECCPUBLIC_BLOB,
            None,
            &mut ephemeral_ncrypt_key,
            ephemeral_pubkey_blob,
            Default::default(),
        )
    };

    if status.is_err() {
        let _ = unsafe { NCryptFreeObject(sw_provider) };
        return Err(format!(
            "Failed to import ephemeral public key into NCrypt: {:?}",
            status
        ));
    }

    // Now perform ECDH: TPM_private * ephemeral_public = shared_secret
    // This is where Windows Hello gets triggered!
    let mut secret_handle: NCRYPT_SECRET_HANDLE = NCRYPT_SECRET_HANDLE::default();
    let status = unsafe {
        NCryptSecretAgreement(
            tpm_key,
            ephemeral_ncrypt_key,
            &mut secret_handle,
            Default::default(),
        )
    };

    if status.is_err() {
        // Check for common error codes in the error
        let err_str = format!("{:?}", status);
        let _ = unsafe { NCryptFreeObject(ephemeral_ncrypt_key) };
        let _ = unsafe { NCryptFreeObject(sw_provider) };
        if err_str.contains("CANCELLED") || err_str.contains("cancelled") {
            return Err("Authentication cancelled by user".to_string());
        }
        return Err(format!("ECDH secret agreement failed: {:?}", status));
    }

    // Derive raw shared secret using NCryptDeriveKey
    let shared_secret = derive_ncrypt_secret(secret_handle)?;

    // Clean up - NCryptFreeObject works for secret handles too
    // We need to use the raw handle value since NCRYPT_SECRET_HANDLE doesn't implement Param
    unsafe {
        use windows::Win32::Security::Cryptography::NCRYPT_HANDLE;
        let _ = NCryptFreeObject(NCRYPT_HANDLE(secret_handle.0));
    }
    let _ = unsafe { NCryptFreeObject(ephemeral_ncrypt_key) };
    let _ = unsafe { NCryptFreeObject(sw_provider) };

    Ok(shared_secret)
}

/// Derive raw shared secret from BCrypt secret agreement handle
fn derive_bcrypt_secret(
    secret_handle: windows::Win32::Security::Cryptography::BCRYPT_SECRET_HANDLE,
) -> Result<Vec<u8>, String> {
    // Use TRUNCATE KDF to get the raw ECDH output
    let kdf_type = w!("TRUNCATE");

    // First get the size
    let mut derived_size: u32 = 0;
    let status = unsafe {
        windows::Win32::Security::Cryptography::BCryptDeriveKey(
            secret_handle,
            kdf_type,
            None,
            None,
            &mut derived_size,
            0,
        )
    };

    if status.is_err() {
        return Err(format!("Failed to get derived key size: {:?}", status));
    }

    // Now derive the key
    let mut derived_key = vec![0u8; derived_size as usize];
    let status = unsafe {
        windows::Win32::Security::Cryptography::BCryptDeriveKey(
            secret_handle,
            kdf_type,
            None,
            Some(&mut derived_key),
            &mut derived_size,
            0,
        )
    };

    if status.is_err() {
        return Err(format!("Failed to derive key: {:?}", status));
    }

    derived_key.truncate(derived_size as usize);
    Ok(derived_key)
}

/// Derive raw shared secret from NCrypt secret agreement handle
fn derive_ncrypt_secret(secret_handle: NCRYPT_SECRET_HANDLE) -> Result<Vec<u8>, String> {
    // Use TRUNCATE KDF to get the raw ECDH output
    let kdf_type = w!("TRUNCATE");

    // First get the size
    // NOTE: We do NOT use NCRYPT_SILENT_FLAG here because Windows Hello authentication
    // may be deferred until this point. Using silent flag would prevent the biometric
    // prompt from appearing, causing the operation to hang.
    let mut derived_size: u32 = 0;
    let status = unsafe {
        windows::Win32::Security::Cryptography::NCryptDeriveKey(
            secret_handle,
            kdf_type,
            None,
            None,
            &mut derived_size,
            0, // Allow UI for Windows Hello
        )
    };

    if status.is_err() {
        return Err(format!(
            "Failed to get NCrypt derived key size: {:?}",
            status
        ));
    }

    // Now derive the key
    let mut derived_key = vec![0u8; derived_size as usize];
    let status = unsafe {
        windows::Win32::Security::Cryptography::NCryptDeriveKey(
            secret_handle,
            kdf_type,
            None,
            Some(&mut derived_key),
            &mut derived_size,
            0, // Allow UI for Windows Hello
        )
    };

    if status.is_err() {
        return Err(format!("Failed to derive NCrypt key: {:?}", status));
    }

    derived_key.truncate(derived_size as usize);
    Ok(derived_key)
}

/// SHA-256 hash using BCrypt
fn sha256(data: &[u8]) -> Result<[u8; 32], String> {
    let mut alg_handle: BCRYPT_ALG_HANDLE = BCRYPT_ALG_HANDLE::default();

    let status = unsafe {
        BCryptOpenAlgorithmProvider(
            &mut alg_handle,
            BCRYPT_SHA256_ALGORITHM,
            None,
            BCRYPT_OPEN_ALGORITHM_PROVIDER_FLAGS(0),
        )
    };

    if status.is_err() {
        return Err(format!("Failed to open SHA256 algorithm: {:?}", status));
    }

    // Get object length for hash object
    let mut object_length: u32 = 0;
    let mut result_size: u32 = 0;
    let status = unsafe {
        BCryptGetProperty(
            alg_handle,
            BCRYPT_OBJECT_LENGTH,
            Some(std::slice::from_raw_parts_mut(
                &mut object_length as *mut u32 as *mut u8,
                4,
            )),
            &mut result_size,
            0,
        )
    };

    if status.is_err() {
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to get hash object length: {:?}", status));
    }

    // Create hash object
    let mut hash_object = vec![0u8; object_length as usize];
    let mut hash_handle: BCRYPT_HASH_HANDLE = BCRYPT_HASH_HANDLE::default();

    let status = unsafe {
        BCryptCreateHash(
            alg_handle,
            &mut hash_handle,
            Some(&mut hash_object),
            None,
            0,
        )
    };

    if status.is_err() {
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to create hash: {:?}", status));
    }

    // Hash the data
    let status = unsafe { BCryptHashData(hash_handle, data, 0) };

    if status.is_err() {
        let _ = unsafe { BCryptDestroyHash(hash_handle) };
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to hash data: {:?}", status));
    }

    // Finish and get the hash
    let mut hash = [0u8; 32];
    let status = unsafe { BCryptFinishHash(hash_handle, &mut hash, 0) };

    let _ = unsafe { BCryptDestroyHash(hash_handle) };
    let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };

    if status.is_err() {
        return Err(format!("Failed to finish hash: {:?}", status));
    }

    Ok(hash)
}

/// Generate random bytes using BCrypt
fn rand_bytes<const N: usize>() -> Result<[u8; N], String> {
    let mut bytes = [0u8; N];
    let status = unsafe { BCryptGenRandom(None, &mut bytes, BCRYPTGENRANDOM_FLAGS(0)) };

    if status.is_err() {
        return Err(format!("Failed to generate random bytes: {:?}", status));
    }

    Ok(bytes)
}

/// AES-256-GCM encryption using BCrypt
fn aes_gcm_encrypt(
    key: &[u8; 32],
    nonce: &[u8; 12],
    plaintext: &[u8],
) -> Result<(Vec<u8>, [u8; 16]), String> {
    let mut alg_handle: BCRYPT_ALG_HANDLE = BCRYPT_ALG_HANDLE::default();

    let status = unsafe {
        BCryptOpenAlgorithmProvider(
            &mut alg_handle,
            BCRYPT_AES_ALGORITHM,
            None,
            BCRYPT_OPEN_ALGORITHM_PROVIDER_FLAGS(0),
        )
    };

    if status.is_err() {
        return Err(format!("Failed to open AES algorithm: {:?}", status));
    }

    // Set GCM mode
    let gcm_mode_bytes = unsafe {
        std::slice::from_raw_parts(
            BCRYPT_CHAIN_MODE_GCM.as_ptr() as *const u8,
            (BCRYPT_CHAIN_MODE_GCM.len() + 1) * 2, // Include null terminator, UTF-16
        )
    };

    // Convert BCRYPT_ALG_HANDLE to BCRYPT_HANDLE for BCryptSetProperty
    let status = unsafe {
        BCryptSetProperty(
            windows::Win32::Security::Cryptography::BCRYPT_HANDLE(alg_handle.0),
            BCRYPT_CHAINING_MODE,
            gcm_mode_bytes,
            0,
        )
    };

    if status.is_err() {
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to set GCM mode: {:?}", status));
    }

    // Get key object length
    let mut object_length: u32 = 0;
    let mut result_size: u32 = 0;
    let status = unsafe {
        BCryptGetProperty(
            alg_handle,
            BCRYPT_OBJECT_LENGTH,
            Some(std::slice::from_raw_parts_mut(
                &mut object_length as *mut u32 as *mut u8,
                4,
            )),
            &mut result_size,
            0,
        )
    };

    if status.is_err() {
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to get key object length: {:?}", status));
    }

    // Generate symmetric key
    let mut key_object = vec![0u8; object_length as usize];
    let mut key_handle: BCRYPT_KEY_HANDLE = BCRYPT_KEY_HANDLE::default();

    let status = unsafe {
        windows::Win32::Security::Cryptography::BCryptGenerateSymmetricKey(
            alg_handle,
            &mut key_handle,
            Some(&mut key_object),
            key,
            0,
        )
    };

    if status.is_err() {
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to generate AES key: {:?}", status));
    }

    // Prepare auth info for GCM
    let mut tag = [0u8; 16];
    let mut nonce_copy = *nonce;
    let mut auth_info = BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO {
        cbSize: std::mem::size_of::<BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO>() as u32,
        dwInfoVersion: BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO_VERSION,
        pbNonce: nonce_copy.as_mut_ptr(),
        cbNonce: nonce_copy.len() as u32,
        pbAuthData: ptr::null_mut(),
        cbAuthData: 0,
        pbTag: tag.as_mut_ptr(),
        cbTag: tag.len() as u32,
        pbMacContext: ptr::null_mut(),
        cbMacContext: 0,
        cbAAD: 0,
        cbData: 0,
        dwFlags: 0,
    };

    // Allocate output buffer
    let mut ciphertext = vec![0u8; plaintext.len()];
    let mut ciphertext_len: u32 = 0;

    // Encrypt
    let status = unsafe {
        BCryptEncrypt(
            key_handle,
            Some(plaintext),
            Some(&auth_info as *const _ as *const c_void),
            None,
            Some(&mut ciphertext),
            &mut ciphertext_len,
            BCRYPT_FLAGS(0),
        )
    };

    let _ = unsafe { BCryptDestroyKey(key_handle) };
    let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };

    if status.is_err() {
        return Err(format!("AES-GCM encryption failed: {:?}", status));
    }

    ciphertext.truncate(ciphertext_len as usize);
    Ok((ciphertext, tag))
}

/// AES-256-GCM decryption using BCrypt
fn aes_gcm_decrypt(
    key: &[u8; 32],
    nonce: &[u8],
    ciphertext: &[u8],
    tag: &[u8],
) -> Result<Vec<u8>, String> {
    let mut alg_handle: BCRYPT_ALG_HANDLE = BCRYPT_ALG_HANDLE::default();

    let status = unsafe {
        BCryptOpenAlgorithmProvider(
            &mut alg_handle,
            BCRYPT_AES_ALGORITHM,
            None,
            BCRYPT_OPEN_ALGORITHM_PROVIDER_FLAGS(0),
        )
    };

    if status.is_err() {
        return Err(format!("Failed to open AES algorithm: {:?}", status));
    }

    // Set GCM mode
    let gcm_mode_bytes = unsafe {
        std::slice::from_raw_parts(
            BCRYPT_CHAIN_MODE_GCM.as_ptr() as *const u8,
            (BCRYPT_CHAIN_MODE_GCM.len() + 1) * 2,
        )
    };

    // Convert BCRYPT_ALG_HANDLE to BCRYPT_HANDLE for BCryptSetProperty
    let status = unsafe {
        BCryptSetProperty(
            windows::Win32::Security::Cryptography::BCRYPT_HANDLE(alg_handle.0),
            BCRYPT_CHAINING_MODE,
            gcm_mode_bytes,
            0,
        )
    };

    if status.is_err() {
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to set GCM mode: {:?}", status));
    }

    // Get key object length
    let mut object_length: u32 = 0;
    let mut result_size: u32 = 0;
    let status = unsafe {
        BCryptGetProperty(
            alg_handle,
            BCRYPT_OBJECT_LENGTH,
            Some(std::slice::from_raw_parts_mut(
                &mut object_length as *mut u32 as *mut u8,
                4,
            )),
            &mut result_size,
            0,
        )
    };

    if status.is_err() {
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to get key object length: {:?}", status));
    }

    // Generate symmetric key
    let mut key_object = vec![0u8; object_length as usize];
    let mut key_handle: BCRYPT_KEY_HANDLE = BCRYPT_KEY_HANDLE::default();

    let status = unsafe {
        windows::Win32::Security::Cryptography::BCryptGenerateSymmetricKey(
            alg_handle,
            &mut key_handle,
            Some(&mut key_object),
            key,
            0,
        )
    };

    if status.is_err() {
        let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };
        return Err(format!("Failed to generate AES key: {:?}", status));
    }

    // Prepare auth info for GCM
    let mut nonce_copy = nonce.to_vec();
    let mut tag_copy = tag.to_vec();
    let mut auth_info = BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO {
        cbSize: std::mem::size_of::<BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO>() as u32,
        dwInfoVersion: BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO_VERSION,
        pbNonce: nonce_copy.as_mut_ptr(),
        cbNonce: nonce_copy.len() as u32,
        pbAuthData: ptr::null_mut(),
        cbAuthData: 0,
        pbTag: tag_copy.as_mut_ptr(),
        cbTag: tag_copy.len() as u32,
        pbMacContext: ptr::null_mut(),
        cbMacContext: 0,
        cbAAD: 0,
        cbData: 0,
        dwFlags: 0,
    };

    // Allocate output buffer
    let mut plaintext = vec![0u8; ciphertext.len()];
    let mut plaintext_len: u32 = 0;

    // Decrypt
    let status = unsafe {
        BCryptDecrypt(
            key_handle,
            Some(ciphertext),
            Some(&auth_info as *const _ as *const c_void),
            None,
            Some(&mut plaintext),
            &mut plaintext_len,
            BCRYPT_FLAGS(0),
        )
    };

    let _ = unsafe { BCryptDestroyKey(key_handle) };
    let _ = unsafe { BCryptCloseAlgorithmProvider(alg_handle, 0) };

    if status.is_err() {
        return Err(format!(
            "AES-GCM decryption failed (status: {:?}). Tag mismatch or corrupted data.",
            status
        ));
    }

    plaintext.truncate(plaintext_len as usize);
    Ok(plaintext)
}
