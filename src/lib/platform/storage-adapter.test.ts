import { CapacitorStorage, ExtensionStorage, getStorageProvider } from './storage-adapter';

// Mock isMobile
jest.mock('./index', () => ({
  isMobile: jest.fn()
}));

// Mock webextension-polyfill
const mockStorageGet = jest.fn();
const mockStorageSet = jest.fn();
const mockStorageRemove = jest.fn();

jest.mock('webextension-polyfill', () => ({
  __esModule: true,
  default: {
    storage: {
      local: {
        get: (...args: unknown[]) => mockStorageGet(...args),
        set: (...args: unknown[]) => mockStorageSet(...args),
        remove: (...args: unknown[]) => mockStorageRemove(...args)
      }
    }
  }
}));

// Mock @capacitor/preferences
const mockPreferencesGet = jest.fn();
const mockPreferencesSet = jest.fn();
const mockPreferencesRemove = jest.fn();

jest.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: (...args: unknown[]) => mockPreferencesGet(...args),
    set: (...args: unknown[]) => mockPreferencesSet(...args),
    remove: (...args: unknown[]) => mockPreferencesRemove(...args)
  }
}));

import { isMobile } from './index';

const mockIsMobile = isMobile as jest.MockedFunction<typeof isMobile>;

describe('ExtensionStorage', () => {
  let storage: ExtensionStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new ExtensionStorage();
  });

  describe('get', () => {
    it('retrieves values from browser.storage.local', async () => {
      mockStorageGet.mockResolvedValue({ key1: 'value1', key2: 'value2' });

      const result = await storage.get(['key1', 'key2']);

      expect(mockStorageGet).toHaveBeenCalledWith(['key1', 'key2']);
      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    });
  });

  describe('set', () => {
    it('stores values in browser.storage.local', async () => {
      mockStorageSet.mockResolvedValue(undefined);

      await storage.set({ key1: 'value1' });

      expect(mockStorageSet).toHaveBeenCalledWith({ key1: 'value1' });
    });
  });

  describe('remove', () => {
    it('removes values from browser.storage.local', async () => {
      mockStorageRemove.mockResolvedValue(undefined);

      await storage.remove(['key1']);

      expect(mockStorageRemove).toHaveBeenCalledWith(['key1']);
    });
  });
});

describe('CapacitorStorage', () => {
  let storage: CapacitorStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new CapacitorStorage();
  });

  describe('get', () => {
    it('retrieves values from Capacitor Preferences', async () => {
      mockPreferencesGet
        .mockResolvedValueOnce({ value: '{"name":"test"}' })
        .mockResolvedValueOnce({ value: '"simpleString"' });

      const result = await storage.get(['key1', 'key2']);

      expect(mockPreferencesGet).toHaveBeenCalledWith({ key: 'key1' });
      expect(mockPreferencesGet).toHaveBeenCalledWith({ key: 'key2' });
      expect(result).toEqual({ key1: { name: 'test' }, key2: 'simpleString' });
    });

    it('skips null values', async () => {
      mockPreferencesGet.mockResolvedValue({ value: null });

      const result = await storage.get(['key1']);

      expect(result).toEqual({});
    });

    it('handles non-JSON strings', async () => {
      mockPreferencesGet.mockResolvedValue({ value: 'not-json' });

      const result = await storage.get(['key1']);

      expect(result).toEqual({ key1: 'not-json' });
    });
  });

  describe('set', () => {
    it('stores JSON values in Capacitor Preferences', async () => {
      mockPreferencesSet.mockResolvedValue(undefined);

      await storage.set({ key1: { name: 'test' } });

      expect(mockPreferencesSet).toHaveBeenCalledWith({
        key: 'key1',
        value: '{"name":"test"}'
      });
    });

    it('stores string values directly', async () => {
      mockPreferencesSet.mockResolvedValue(undefined);

      await storage.set({ key1: 'simpleString' });

      expect(mockPreferencesSet).toHaveBeenCalledWith({
        key: 'key1',
        value: 'simpleString'
      });
    });

    it('stores multiple values', async () => {
      mockPreferencesSet.mockResolvedValue(undefined);

      await storage.set({ key1: 'value1', key2: { nested: true } });

      expect(mockPreferencesSet).toHaveBeenCalledTimes(2);
    });
  });

  describe('remove', () => {
    it('removes values from Capacitor Preferences', async () => {
      mockPreferencesRemove.mockResolvedValue(undefined);

      await storage.remove(['key1', 'key2']);

      expect(mockPreferencesRemove).toHaveBeenCalledWith({ key: 'key1' });
      expect(mockPreferencesRemove).toHaveBeenCalledWith({ key: 'key2' });
    });
  });
});

describe('getStorageProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singletons by reimporting the module
    jest.resetModules();
  });

  it('returns CapacitorStorage when on mobile', async () => {
    jest.doMock('./index', () => ({
      isMobile: jest.fn().mockReturnValue(true)
    }));

    const { getStorageProvider: getProvider } = await import('./storage-adapter');
    const provider = getProvider();

    expect(provider.constructor.name).toBe('CapacitorStorage');
  });

  it('returns ExtensionStorage when not on mobile', async () => {
    jest.doMock('./index', () => ({
      isMobile: jest.fn().mockReturnValue(false)
    }));

    const { getStorageProvider: getProvider } = await import('./storage-adapter');
    const provider = getProvider();

    expect(provider.constructor.name).toBe('ExtensionStorage');
  });

  it('returns singleton instance', () => {
    mockIsMobile.mockReturnValue(false);

    const provider1 = getStorageProvider();
    const provider2 = getStorageProvider();

    expect(provider1).toBe(provider2);
  });
});
