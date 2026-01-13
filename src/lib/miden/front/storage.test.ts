import browser from 'webextension-polyfill';

import { fetchFromStorage, putToStorage, onStorageChanged } from './storage';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    },
    onChanged: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  }
}));

describe('storage utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchFromStorage', () => {
    it('returns value when key exists', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        'my-key': 'my-value'
      });

      const result = await fetchFromStorage('my-key');

      expect(browser.storage.local.get).toHaveBeenCalledWith(['my-key']);
      expect(result).toBe('my-value');
    });

    it('returns null when key does not exist', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await fetchFromStorage('missing-key');

      expect(result).toBeNull();
    });

    it('handles complex objects', async () => {
      const complexValue = { nested: { data: [1, 2, 3] } };
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        'complex-key': complexValue
      });

      const result = await fetchFromStorage('complex-key');

      expect(result).toEqual(complexValue);
    });
  });

  describe('putToStorage', () => {
    it('stores value with key', async () => {
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      await putToStorage('my-key', 'my-value');

      expect(browser.storage.local.set).toHaveBeenCalledWith({ 'my-key': 'my-value' });
    });

    it('stores complex objects', async () => {
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);
      const complexValue = { nested: { data: [1, 2, 3] } };

      await putToStorage('complex-key', complexValue);

      expect(browser.storage.local.set).toHaveBeenCalledWith({ 'complex-key': complexValue });
    });
  });

  describe('onStorageChanged', () => {
    it('registers a listener', () => {
      const callback = jest.fn();

      onStorageChanged('my-key', callback);

      expect(browser.storage.onChanged.addListener).toHaveBeenCalled();
    });

    it('returns cleanup function that removes listener', () => {
      const callback = jest.fn();

      const cleanup = onStorageChanged('my-key', callback);
      cleanup();

      expect(browser.storage.onChanged.removeListener).toHaveBeenCalled();
    });

    it('calls callback when key changes in local storage', () => {
      const callback = jest.fn();
      let registeredHandler: any;

      (browser.storage.onChanged.addListener as jest.Mock).mockImplementation(handler => {
        registeredHandler = handler;
      });

      onStorageChanged('my-key', callback);

      // Simulate storage change
      registeredHandler({ 'my-key': { newValue: 'new-value' } }, 'local');

      expect(callback).toHaveBeenCalledWith('new-value');
    });

    it('does not call callback for different key', () => {
      const callback = jest.fn();
      let registeredHandler: any;

      (browser.storage.onChanged.addListener as jest.Mock).mockImplementation(handler => {
        registeredHandler = handler;
      });

      onStorageChanged('my-key', callback);

      // Simulate storage change for different key
      registeredHandler({ 'other-key': { newValue: 'new-value' } }, 'local');

      expect(callback).not.toHaveBeenCalled();
    });

    it('does not call callback for non-local storage area', () => {
      const callback = jest.fn();
      let registeredHandler: any;

      (browser.storage.onChanged.addListener as jest.Mock).mockImplementation(handler => {
        registeredHandler = handler;
      });

      onStorageChanged('my-key', callback);

      // Simulate storage change in sync area
      registeredHandler({ 'my-key': { newValue: 'new-value' } }, 'sync');

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
