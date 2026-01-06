import { Buffer } from 'buffer';

/**
 * password => passKey
 * passKey + salt => derivedPassKey
 * stuff + derivedPassKey => enc_stuff
 * enc_stuff + derivedPassKey => stuff
 *
 * Encrypt
 * 1) salt = generateSalt()
 * 2) passKey = generateKey(password*)
 * 3) derivedPassKey = deriveKey(passKey, salt)
 * 3) encryptedStuff = encrypt(stuff*, derivedPassKey)
 * 4) persist*(salt, encryptedStuff)
 *
 * Decrypt
 * 1) load*(salt, encryptedStuff)
 * 2) derivedPassKey = deriveKey(passKey*, salt)
 * 3) stuff = decrypt(encryptedStuff*, derivedPassKey)
 *
 */

export type EncryptedPayload = { dt: string; iv: string };

export async function encrypt(stuff: any, key: CryptoKey): Promise<EncryptedPayload> {
  const stuffStr = JSON.stringify(stuff);
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encryptedStuff = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    Buffer.from(stuffStr)
  );

  return {
    dt: Buffer.from(encryptedStuff).toString('hex'),
    iv: Buffer.from(iv).toString('hex')
  };
}

export async function decrypt<T = any>(
  { dt: encryptedStuffHex, iv: ivHex }: EncryptedPayload,
  key: CryptoKey
): Promise<T> {
  const stuffBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: Buffer.from(ivHex, 'hex') },
    key,
    Buffer.from(encryptedStuffHex, 'hex')
  );
  const stuffStr = Buffer.from(stuffBuf).toString();
  return JSON.parse(stuffStr);
}

export async function encryptJson(jsonStuff: any, key: CryptoKey): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const stuffStr = JSON.stringify(jsonStuff);
  const stuffBytes = encoder.encode(stuffStr);

  const iv = crypto.getRandomValues(new Uint8Array(16));

  const data = new Uint8Array(stuffBytes);
  const encryptedStuff = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer
    },
    key,
    data
  );

  const arrayBufferToBase64 = (buffer: ArrayBuffer | Uint8Array) => {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(b => (binary += String.fromCharCode(b)));
    return btoa(binary);
  };

  return {
    dt: arrayBufferToBase64(encryptedStuff),
    iv: arrayBufferToBase64(iv)
  };
}

export async function decryptJson(payload: EncryptedPayload, key: CryptoKey): Promise<any> {
  const { dt, iv } = payload;

  // Convert Base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const encryptedData = base64ToArrayBuffer(dt);
  const ivBytes = base64ToArrayBuffer(iv);

  const decryptedStuff = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key, encryptedData);

  const decoder = new TextDecoder();
  const decryptedStr = decoder.decode(decryptedStuff);

  try {
    const parsedData = JSON.parse(decryptedStr);
    return parsedData;
  } catch (err) {
    console.error('Failed to parse decrypted JSON:', err);
    throw new Error('Decryption succeeded but JSON parsing failed.');
  }
}

// This is deterministic given the string, per Evan
export async function generateKey(password: string) {
  const hash = await crypto.subtle.digest('SHA-256', Buffer.from(password, 'utf-8'));
  return importKey(hash);
}

export function deriveKey(key: CryptoKey, salt: Uint8Array, iterations = 1_310_000) {
  const saltBuffer = new ArrayBuffer(salt.byteLength);
  new Uint8Array(saltBuffer).set(new Uint8Array(salt));
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export function generateSalt(byteCount = 32) {
  const view = new Uint8Array(byteCount);
  crypto.getRandomValues(view);
  return view;
}

function importKey(keyData: ArrayBuffer) {
  return crypto.subtle.importKey('raw', keyData, 'PBKDF2', false, ['deriveBits', 'deriveKey']);
}

/**
 * @deprecated
 */
export function generateKeyLegacy(password: string) {
  const buf = Buffer.alloc(32, password);
  return importKey(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/**
 * @deprecated
 */
export function deriveKeyLegacy(key: CryptoKey, salt: Uint8Array) {
  return deriveKey(key, salt, 310_000);
}
