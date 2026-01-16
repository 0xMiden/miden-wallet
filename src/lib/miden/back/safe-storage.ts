import { Buffer } from 'buffer';

import { getStorageProvider, StorageProvider } from 'lib/platform/storage-adapter';
import * as Passworder from 'lib/miden/passworder';

// Get platform-appropriate storage provider
const storage: StorageProvider = getStorageProvider();

export async function isStored(storageKey: string) {
  storageKey = await wrapStorageKey(storageKey);

  const value = await getPlain(storageKey);
  return value !== undefined;
}

export async function fetchAndDecryptOne<T>(storageKey: string, passKey: CryptoKey) {
  storageKey = await wrapStorageKey(storageKey);
  const payload = await fetchEncryptedOne<string>(storageKey);
  let cursor = 0;
  const [saltHex, iv, dt] = [64, 32, -1].map(length =>
    payload.slice(cursor, length !== -1 ? (cursor += length) : undefined)
  );
  const encrypted = { dt, iv };
  const salt = new Uint8Array(Buffer.from(saltHex, 'hex'));
  let derivedPassKey = await Passworder.deriveKey(passKey, salt);
  return Passworder.decrypt<T>(encrypted, derivedPassKey);
}

export async function encryptAndSaveMany(items: [string, any][], passKey: CryptoKey) {
  const encItems = await Promise.all(
    items.map(async ([storageKey, stuff]) => {
      storageKey = await wrapStorageKey(storageKey);

      const salt = Passworder.generateSalt();

      const derivedPassKey = await Passworder.deriveKey(passKey, salt);
      const { dt, iv } = await Passworder.encrypt(stuff, derivedPassKey);

      const saltHex = Buffer.from(salt).toString('hex');
      const toSave = [saltHex, iv, dt].join('');

      return [storageKey, toSave] as [typeof storageKey, typeof toSave];
    })
  );

  await saveEncrypted(encItems);
}

export async function removeMany(keys: string[]) {
  await storage.remove(await Promise.all(keys.map(wrapStorageKey)));
}

export async function getPlain<T>(key: string): Promise<T | undefined> {
  const items = await storage.get([key]);
  return items[key] as T | undefined;
}

export function savePlain<T>(key: string, value: T) {
  return storage.set({ [key]: value });
}

async function fetchEncryptedOne<T>(key: string) {
  const items = await storage.get([key]);
  if (items[key] !== undefined) {
    return items[key] as T;
  } else {
    throw new Error('Some storage item not found');
  }
}

async function saveEncrypted<T>(items: { [k: string]: T } | [string, T][]) {
  if (Array.isArray(items)) {
    items = iterToObj(items);
  }
  await storage.set(items);
}

function iterToObj(iter: [string, any][]) {
  const obj: { [k: string]: any } = {};
  for (const [k, v] of iter) {
    obj[k] = v;
  }
  return obj;
}

async function wrapStorageKey(key: string) {
  const bytes = await crypto.subtle.digest('SHA-256', Buffer.from(key, 'utf-8'));
  return Buffer.from(bytes).toString('hex');
}

export async function fetchAndDecryptOneWithLegacyFallBack<T>(storageKey: string, passKey: CryptoKey) {
  try {
    return await fetchAndDecryptOne<T>(storageKey, passKey);
  } catch (err: any) {
    return await fetchAndDecryptOneLegacy<T>(storageKey, passKey);
  }
}

/**
 * @deprecated
 */
export async function isStoredLegacy(storageKey: string) {
  const value = await getPlain(storageKey);
  return value !== undefined;
}

/**
 * @deprecated
 */
export async function removeManyLegacy(keys: string[]) {
  await storage.remove(keys);
}

/**
 * @deprecated
 */
export async function fetchAndDecryptOneLegacy<T>(storageKey: string, passKey: CryptoKey) {
  storageKey = await wrapStorageKey(storageKey);
  const payload = await fetchEncryptedOne<string>(storageKey);
  let cursor = 0;
  const [saltHex, iv, dt] = [64, 32, -1].map(length =>
    payload.slice(cursor, length !== -1 ? (cursor += length) : undefined)
  );
  const encrypted = { dt, iv };
  const salt = new Uint8Array(Buffer.from(saltHex, 'hex'));
  let derivedPassKey = await Passworder.deriveKeyLegacy(passKey, salt);
  return Passworder.decrypt<T>(encrypted, derivedPassKey);
}

/**
 * @deprecated
 */
export async function encryptAndSaveManyLegacy(items: [string, any][], passKey: CryptoKey) {
  const encItems = await Promise.all(
    items.map(async ([storageKey, stuff]) => {
      const salt = Passworder.generateSalt();
      const derivedPassKey = await Passworder.deriveKeyLegacy(passKey, salt);
      const encrypted = await Passworder.encrypt(stuff, derivedPassKey);

      const encStorage = {
        encrypted,
        salt: Buffer.from(salt).toString('hex')
      };

      return [storageKey, encStorage] as [typeof storageKey, typeof encStorage];
    })
  );

  await saveEncrypted(encItems);
}
