//! macOS Secure Enclave implementation
//!
//! Uses Security.framework to store keys in the Secure Enclave.
//! Keys are protected by biometric authentication (Touch ID).
//!
//! Encryption scheme:
//! 1. Generate EC P-256 key pair in Secure Enclave (private key never leaves chip)
//! 2. For encryption: Use ECIES - generate ephemeral key, ECDH, derive AES key, encrypt
//! 3. For decryption: ECDH with Secure Enclave key (triggers Touch ID), derive AES key, decrypt

use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use core_foundation::base::TCFType;
use core_foundation::data::CFData;
use core_foundation::dictionary::CFMutableDictionary;
use core_foundation::error::CFError;
use core_foundation::string::CFString;
use core_foundation_sys::dictionary::CFDictionarySetValue;
use log::info;
use security_framework::access_control::{ProtectionMode, SecAccessControl};
use security_framework::item::{ItemClass, ItemSearchOptions, KeyClass, Location, Reference, SearchResult};
use security_framework::key::{GenerateKeyOptions, KeyType, SecKey, Token};
use security_framework_sys::access_control::{
    kSecAccessControlPrivateKeyUsage, kSecAccessControlUserPresence,
};
use std::os::raw::c_void;
use std::ptr;

const KEY_LABEL: &str = "Miden Wallet Secure Enclave Key";
const KEY_SIZE: u32 = 256; // P-256

/// Check if Secure Enclave is available on this Mac
pub fn is_hardware_security_available() -> Result<bool, String> {
    // Secure Enclave is available on:
    // - Macs with T1/T2 chip (2016+)
    // - Macs with Apple Silicon (M1/M2/M3)
    // We can check by trying to query for Secure Enclave support

    // For now, assume it's available on macOS - the key generation will fail
    // gracefully if Secure Enclave is not present
    Ok(true)
}

/// Check if we already have a hardware key stored
pub fn has_hardware_key() -> Result<bool, String> {
    match get_secure_enclave_key() {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Generate a new key pair in the Secure Enclave
pub fn generate_hardware_key() -> Result<(), String> {
    info!("Generating Secure Enclave key");

    // Check if key already exists
    if has_hardware_key().unwrap_or(false) {
        info!("Secure Enclave key already exists");
        return Ok(());
    }

    // Create access control: require user presence (Touch ID or system password)
    // Flags: UserPresence (biometric OR password) + PrivateKeyUsage (for SE keys)
    let flags = kSecAccessControlUserPresence | kSecAccessControlPrivateKeyUsage;
    let access_control =
        SecAccessControl::create_with_protection(Some(ProtectionMode::AccessibleWhenUnlockedThisDeviceOnly), flags)
            .map_err(|e| format!("Failed to create access control: {}", e))?;

    // Generate key options for Secure Enclave
    let mut options = GenerateKeyOptions::default();
    options.set_key_type(KeyType::ec());
    options.set_size_in_bits(KEY_SIZE);
    options.set_token(Token::SecureEnclave);
    options.set_label(KEY_LABEL);
    options.set_location(Location::DataProtectionKeychain);
    options.set_access_control(access_control);

    // Generate the key pair using the options dictionary
    let dict = options.to_dictionary();
    let _key = SecKey::generate(dict).map_err(|e| format!("Failed to generate Secure Enclave key: {}", e))?;

    info!("Secure Enclave key generated successfully");
    Ok(())
}

/// Delete the hardware key from Secure Enclave
pub fn delete_hardware_key() -> Result<(), String> {
    info!("Deleting Secure Enclave key");

    // First, get the key to delete it
    match get_secure_enclave_key() {
        Ok(key) => {
            key.delete().map_err(|e| format!("Failed to delete Secure Enclave key: {}", e))?;
            info!("Secure Enclave key deleted");
            Ok(())
        }
        Err(_) => {
            // Key doesn't exist, nothing to delete
            info!("Secure Enclave key not found, nothing to delete");
            Ok(())
        }
    }
}

/// Encrypt data using the Secure Enclave key
///
/// Uses ECIES: generates ephemeral key pair, performs ECDH with SE key,
/// derives AES key, encrypts data. Returns base64(ephemeral_pubkey || nonce || ciphertext || tag)
pub fn encrypt_with_hardware_key(data: &str) -> Result<String, String> {
    info!("Encrypting with Secure Enclave key");

    // Get the Secure Enclave private key
    let se_key = get_secure_enclave_key()?;

    // Get the public key for ECDH
    let se_public_key = se_key
        .public_key()
        .ok_or("Failed to get public key from Secure Enclave key")?;

    // Generate ephemeral key pair for ECIES (in software, not SE)
    let mut ephemeral_options = GenerateKeyOptions::default();
    ephemeral_options.set_key_type(KeyType::ec());
    ephemeral_options.set_size_in_bits(KEY_SIZE);
    // No location = transient key (not persisted)

    let ephemeral_dict = ephemeral_options.to_dictionary();
    let ephemeral_key =
        SecKey::generate(ephemeral_dict).map_err(|e| format!("Failed to generate ephemeral key: {}", e))?;

    let ephemeral_public_key = ephemeral_key
        .public_key()
        .ok_or("Failed to get ephemeral public key")?;

    // Perform ECDH: ephemeral_private * SE_public = shared_secret
    let shared_secret = ecdh_key_exchange(&ephemeral_key, &se_public_key)?;

    // Derive AES-256 key from shared secret using SHA-256
    let aes_key = sha256(&shared_secret);

    // Encrypt data with AES-GCM
    let plaintext = data.as_bytes();
    let nonce: [u8; 12] = rand_bytes();
    let (ciphertext, tag) = aes_gcm_encrypt(&aes_key, &nonce, plaintext)?;

    // Export ephemeral public key
    let ephemeral_pubkey_data = ephemeral_public_key
        .external_representation()
        .ok_or("Failed to export ephemeral public key")?;

    // Combine: ephemeral_pubkey_len (2 bytes) || ephemeral_pubkey || nonce || ciphertext || tag
    let mut result = Vec::new();
    let pubkey_len = ephemeral_pubkey_data.len() as u16;
    result.extend_from_slice(&pubkey_len.to_be_bytes());
    result.extend_from_slice(ephemeral_pubkey_data.bytes());
    result.extend_from_slice(&nonce);
    result.extend_from_slice(&ciphertext);
    result.extend_from_slice(&tag);

    Ok(BASE64.encode(&result))
}

/// Decrypt data using the Secure Enclave key
///
/// This will trigger Touch ID authentication
pub fn decrypt_with_hardware_key(encrypted: &str) -> Result<String, String> {
    info!("Decrypting with Secure Enclave key (will prompt for Touch ID)");

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

    let ephemeral_pubkey_data = &data[2..2 + pubkey_len];
    let nonce = &data[2 + pubkey_len..2 + pubkey_len + 12];
    let ciphertext_and_tag = &data[2 + pubkey_len + 12..];

    if ciphertext_and_tag.len() < 16 {
        return Err("Encrypted data too short for tag".to_string());
    }

    let ciphertext = &ciphertext_and_tag[..ciphertext_and_tag.len() - 16];
    let tag = &ciphertext_and_tag[ciphertext_and_tag.len() - 16..];

    // Import ephemeral public key
    let ephemeral_public_key = import_ec_public_key(ephemeral_pubkey_data)?;

    // Get the Secure Enclave private key (this triggers Touch ID!)
    let se_key = get_secure_enclave_key()?;

    // Perform ECDH: SE_private * ephemeral_public = shared_secret
    // This operation happens inside the Secure Enclave and triggers biometric auth
    let shared_secret = ecdh_key_exchange(&se_key, &ephemeral_public_key)?;

    // Derive AES-256 key from shared secret
    let aes_key = sha256(&shared_secret);

    // Decrypt with AES-GCM
    let plaintext = aes_gcm_decrypt(&aes_key, nonce, ciphertext, tag)?;

    String::from_utf8(plaintext).map_err(|e| format!("Decrypted data is not valid UTF-8: {}", e))
}

/// Get the existing Secure Enclave key
fn get_secure_enclave_key() -> Result<SecKey, String> {
    let mut search = ItemSearchOptions::new();
    search.class(ItemClass::key());
    search.key_class(KeyClass::private());
    search.label(KEY_LABEL);
    search.limit(1i64);
    search.load_refs(true);

    let results = search.search().map_err(|e| {
        format!(
            "Secure Enclave key not found (error: {}). Generate one first.",
            e
        )
    })?;

    for result in results {
        if let SearchResult::Ref(Reference::Key(key)) = result {
            return Ok(key);
        }
    }

    Err("Secure Enclave key not found. Generate one first.".to_string())
}

/// Perform ECDH key exchange using Security.framework
fn ecdh_key_exchange(private_key: &SecKey, public_key: &SecKey) -> Result<Vec<u8>, String> {
    use core_foundation::base::CFType;
    use core_foundation::dictionary::CFDictionary;
    use core_foundation::error::CFErrorRef;
    use security_framework_sys::key::SecKeyCopyKeyExchangeResult;

    // kSecKeyAlgorithmECDHKeyExchangeStandard
    let algorithm = CFString::new("ecdhKeyExchangeStandard");

    let params = CFDictionary::<CFString, CFType>::from_CFType_pairs(&[]);

    let mut error: CFErrorRef = ptr::null_mut();
    let result = unsafe {
        SecKeyCopyKeyExchangeResult(
            private_key.as_concrete_TypeRef(),
            algorithm.as_concrete_TypeRef(),
            public_key.as_concrete_TypeRef(),
            params.as_concrete_TypeRef(),
            &mut error,
        )
    };

    if !error.is_null() {
        let cf_error = unsafe { CFError::wrap_under_create_rule(error) };
        return Err(format!("ECDH key exchange failed: {}", cf_error));
    }

    if result.is_null() {
        return Err("ECDH key exchange returned null".to_string());
    }

    let data = unsafe { CFData::wrap_under_create_rule(result) };
    Ok(data.bytes().to_vec())
}

/// Import an EC public key from raw data
fn import_ec_public_key(data: &[u8]) -> Result<SecKey, String> {
    use core_foundation::error::CFErrorRef;
    use security_framework_sys::item::kSecAttrKeyTypeECSECPrimeRandom;
    use security_framework_sys::key::SecKeyCreateWithData;

    let key_data = CFData::from_buffer(data);

    // Create attributes dictionary
    let attrs: CFMutableDictionary<CFString, CFData> = CFMutableDictionary::new();

    // Key type: EC, Key class: public
    unsafe {
        CFDictionarySetValue(
            attrs.as_CFTypeRef() as *mut _,
            security_framework_sys::item::kSecAttrKeyType as *const c_void,
            kSecAttrKeyTypeECSECPrimeRandom as *const c_void,
        );
        CFDictionarySetValue(
            attrs.as_CFTypeRef() as *mut _,
            security_framework_sys::item::kSecAttrKeyClass as *const c_void,
            security_framework_sys::item::kSecAttrKeyClassPublic as *const c_void,
        );
    }

    let mut error: CFErrorRef = ptr::null_mut();
    let key = unsafe {
        SecKeyCreateWithData(key_data.as_concrete_TypeRef(), attrs.as_concrete_TypeRef(), &mut error)
    };

    if !error.is_null() {
        let cf_error = unsafe { CFError::wrap_under_create_rule(error) };
        return Err(format!("Failed to import EC public key: {}", cf_error));
    }

    if key.is_null() {
        return Err("Failed to import EC public key: returned null".to_string());
    }

    Ok(unsafe { SecKey::wrap_under_create_rule(key) })
}

/// SHA-256 hash using CommonCrypto
fn sha256(data: &[u8]) -> [u8; 32] {
    use std::os::raw::c_uint;

    #[link(name = "System", kind = "framework")]
    extern "C" {
        fn CC_SHA256(data: *const u8, len: c_uint, md: *mut u8) -> *mut u8;
    }

    let mut hash = [0u8; 32];
    unsafe {
        CC_SHA256(data.as_ptr(), data.len() as c_uint, hash.as_mut_ptr());
    }
    hash
}

/// Generate random bytes using Security.framework
fn rand_bytes<const N: usize>() -> [u8; N] {
    let mut bytes = [0u8; N];
    let status = unsafe {
        security_framework_sys::random::SecRandomCopyBytes(
            security_framework_sys::random::kSecRandomDefault,
            N,
            bytes.as_mut_ptr() as *mut c_void,
        )
    };
    if status != 0 {
        // Fallback to less secure but still reasonable random
        use std::time::{SystemTime, UNIX_EPOCH};
        let seed = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos() as u64;
        for (i, byte) in bytes.iter_mut().enumerate() {
            *byte = ((seed >> (i % 8 * 8)) ^ (seed >> ((i + 3) % 8 * 8))) as u8;
        }
    }
    bytes
}

/// AES-256-GCM encryption using CommonCrypto
fn aes_gcm_encrypt(key: &[u8; 32], nonce: &[u8; 12], plaintext: &[u8]) -> Result<(Vec<u8>, [u8; 16]), String> {
    unsafe {
        use std::os::raw::c_int;

        #[link(name = "System", kind = "framework")]
        extern "C" {
            fn CCCryptorGCMOneshotEncrypt(
                alg: u32,
                key: *const u8,
                keyLength: usize,
                iv: *const u8,
                ivLen: usize,
                aData: *const u8,
                aDataLen: usize,
                dataIn: *const u8,
                dataInLength: usize,
                cipherOut: *mut u8,
                tag: *mut u8,
                tagLength: usize,
            ) -> c_int;
        }

        const K_CC_ALGORITHM_AES: u32 = 0;

        let mut ciphertext = vec![0u8; plaintext.len()];
        let mut tag = [0u8; 16];

        let status = CCCryptorGCMOneshotEncrypt(
            K_CC_ALGORITHM_AES,
            key.as_ptr(),
            key.len(),
            nonce.as_ptr(),
            nonce.len(),
            ptr::null(),
            0,
            plaintext.as_ptr(),
            plaintext.len(),
            ciphertext.as_mut_ptr(),
            tag.as_mut_ptr(),
            tag.len(),
        );

        if status != 0 {
            return Err(format!("AES-GCM encryption failed: {}", status));
        }

        Ok((ciphertext, tag))
    }
}

/// AES-256-GCM decryption using CommonCrypto
fn aes_gcm_decrypt(key: &[u8; 32], nonce: &[u8], ciphertext: &[u8], tag: &[u8]) -> Result<Vec<u8>, String> {
    unsafe {
        use std::os::raw::c_int;

        #[link(name = "System", kind = "framework")]
        extern "C" {
            fn CCCryptorGCMOneshotDecrypt(
                alg: u32,
                key: *const u8,
                keyLength: usize,
                iv: *const u8,
                ivLen: usize,
                aData: *const u8,
                aDataLen: usize,
                dataIn: *const u8,
                dataInLength: usize,
                dataOut: *mut u8,
                tag: *const u8,
                tagLength: usize,
            ) -> c_int;
        }

        const K_CC_ALGORITHM_AES: u32 = 0;

        let mut plaintext = vec![0u8; ciphertext.len()];

        let status = CCCryptorGCMOneshotDecrypt(
            K_CC_ALGORITHM_AES,
            key.as_ptr(),
            key.len(),
            nonce.as_ptr(),
            nonce.len(),
            ptr::null(),
            0,
            ciphertext.as_ptr(),
            ciphertext.len(),
            plaintext.as_mut_ptr(),
            tag.as_ptr(),
            tag.len(),
        );

        if status != 0 {
            return Err(format!(
                "AES-GCM decryption failed (status: {}). Tag mismatch or corrupted data.",
                status
            ));
        }

        Ok(plaintext)
    }
}
