import { fetchFromStorage, putToStorage, onStorageChanged } from './storage';

// Mock isMobile to return false so extension code paths run
jest.mock('lib/platform', () => ({
  isMobile: () => false
}));

const mockStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn()
  },
  onChanged: {
    addListener: jest.fn(),
    removeListener: jest.fn()
  }
};

// Mock webextension-polyfill with default export for dynamic imports
jest.mock('webextension-polyfill', () => ({
  __esModule: true,
  default: {
    storage: mockStorage
  },
  storage: mockStorage
}));

// Mock storage adapter to use the mock storage
jest.mock('lib/platform/storage-adapter', () => ({
  getStorageProvider: () => mockStorage.local
}));

// Helper to flush promises
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('storage utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchFromStorage', () => {
    it('returns value when key exists', async () => {
      mockStorage.local.get.mockResolvedValue({
        'my-key': 'my-value'
      });

      const result = await fetchFromStorage('my-key');

      expect(mockStorage.local.get).toHaveBeenCalledWith(['my-key']);
      expect(result).toBe('my-value');
    });

    it('returns null when key does not exist', async () => {
      mockStorage.local.get.mockResolvedValue({});

      const result = await fetchFromStorage('missing-key');

      expect(result).toBeNull();
    });

    it('handles complex objects', async () => {
      const complexValue = { nested: { data: [1, 2, 3] } };
      mockStorage.local.get.mockResolvedValue({
        'complex-key': complexValue
      });

      const result = await fetchFromStorage('complex-key');

      expect(result).toEqual(complexValue);
    });
  });

  describe('putToStorage', () => {
    it('stores value with key', async () => {
      mockStorage.local.set.mockResolvedValue(undefined);

      await putToStorage('my-key', 'my-value');

      expect(mockStorage.local.set).toHaveBeenCalledWith({ 'my-key': 'my-value' });
    });

    it('stores complex objects', async () => {
      mockStorage.local.set.mockResolvedValue(undefined);
      const complexValue = { nested: { data: [1, 2, 3] } };

      await putToStorage('complex-key', complexValue);

      expect(mockStorage.local.set).toHaveBeenCalledWith({ 'complex-key': complexValue });
    });
  });

  describe('onStorageChanged', () => {
    it('registers a listener', async () => {
      const callback = jest.fn();

      onStorageChanged('my-key', callback);

      // Wait for the dynamic import to complete
      await flushPromises();

      expect(mockStorage.onChanged.addListener).toHaveBeenCalled();
    });

    it('returns cleanup function', async () => {
      const callback = jest.fn();

      const cleanup = onStorageChanged('my-key', callback);

      // The cleanup function is returned synchronously
      // (though the actual listener removal is async)
      expect(typeof cleanup).toBe('function');
    });

    it('calls callback when key changes in local storage', async () => {
      const callback = jest.fn();
      let registeredHandler: any;

      mockStorage.onChanged.addListener.mockImplementation(handler => {
        registeredHandler = handler;
      });

      onStorageChanged('my-key', callback);

      // Wait for the dynamic import to complete
      await flushPromises();

      // Simulate storage change
      registeredHandler({ 'my-key': { newValue: 'new-value' } }, 'local');

      expect(callback).toHaveBeenCalledWith('new-value');
    });

    it('does not call callback for different key', async () => {
      const callback = jest.fn();
      let registeredHandler: any;

      mockStorage.onChanged.addListener.mockImplementation(handler => {
        registeredHandler = handler;
      });

      onStorageChanged('my-key', callback);

      // Wait for the dynamic import to complete
      await flushPromises();

      // Simulate storage change for different key
      registeredHandler({ 'other-key': { newValue: 'new-value' } }, 'local');

      expect(callback).not.toHaveBeenCalled();
    });

    it('does not call callback for non-local storage area', async () => {
      const callback = jest.fn();
      let registeredHandler: any;

      mockStorage.onChanged.addListener.mockImplementation(handler => {
        registeredHandler = handler;
      });

      onStorageChanged('my-key', callback);

      // Wait for the dynamic import to complete
      await flushPromises();

      // Simulate storage change in sync area
      registeredHandler({ 'my-key': { newValue: 'new-value' } }, 'sync');

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
