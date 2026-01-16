import { isMobile } from './index';

/**
 * Storage provider interface that abstracts browser.storage.local
 * for cross-platform compatibility.
 *
 * Note: Capacitor Preferences is imported lazily to avoid 'window is not defined'
 * errors in service worker contexts.
 */
export interface StorageProvider {
  get(keys: string[]): Promise<Record<string, any>>;
  set(items: Record<string, any>): Promise<void>;
  remove(keys: string[]): Promise<void>;
}

/**
 * Browser extension storage implementation using browser.storage.local
 */
export class ExtensionStorage implements StorageProvider {
  async get(keys: string[]): Promise<Record<string, any>> {
    const browser = await import('webextension-polyfill').then(m => m.default);
    return browser.storage.local.get(keys);
  }

  async set(items: Record<string, any>): Promise<void> {
    const browser = await import('webextension-polyfill').then(m => m.default);
    await browser.storage.local.set(items);
  }

  async remove(keys: string[]): Promise<void> {
    const browser = await import('webextension-polyfill').then(m => m.default);
    await browser.storage.local.remove(keys);
  }
}

// Lazy-load Capacitor Preferences to avoid window errors in service workers
async function getPreferences() {
  const { Preferences } = await import('@capacitor/preferences');
  return Preferences;
}

/**
 * Capacitor storage implementation using @capacitor/preferences
 */
export class CapacitorStorage implements StorageProvider {
  async get(keys: string[]): Promise<Record<string, any>> {
    const Preferences = await getPreferences();
    const result: Record<string, any> = {};
    for (const key of keys) {
      const { value } = await Preferences.get({ key });
      if (value !== null) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          // If it's not JSON, store as-is
          result[key] = value;
        }
      }
    }
    return result;
  }

  async set(items: Record<string, any>): Promise<void> {
    const Preferences = await getPreferences();
    for (const [key, value] of Object.entries(items)) {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await Preferences.set({ key, value: serialized });
    }
  }

  async remove(keys: string[]): Promise<void> {
    const Preferences = await getPreferences();
    for (const key of keys) {
      await Preferences.remove({ key });
    }
  }
}

// Singleton instances
let extensionStorage: ExtensionStorage | null = null;
let capacitorStorage: CapacitorStorage | null = null;

/**
 * Gets the appropriate storage provider based on the current platform.
 */
export function getStorageProvider(): StorageProvider {
  if (isMobile()) {
    if (!capacitorStorage) {
      capacitorStorage = new CapacitorStorage();
    }
    return capacitorStorage;
  }

  if (!extensionStorage) {
    extensionStorage = new ExtensionStorage();
  }
  return extensionStorage;
}

export default getStorageProvider;
