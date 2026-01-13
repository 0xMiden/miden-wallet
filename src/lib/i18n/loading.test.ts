import browser from 'webextension-polyfill';

import { REFRESH_MSGTYPE, onInited, updateLocale } from './loading';

// Mock dependencies
jest.mock('webextension-polyfill', () => ({
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn()
  }
}));

jest.mock('./core', () => ({
  init: jest.fn(() => Promise.resolve())
}));

jest.mock('./saving', () => ({
  saveLocale: jest.fn()
}));

describe('i18n/loading', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress jsdom console.error for window.location.reload() not implemented
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('REFRESH_MSGTYPE', () => {
    it('should be ALEO_I18N_REFRESH', () => {
      expect(REFRESH_MSGTYPE).toBe('ALEO_I18N_REFRESH');
    });
  });

  describe('onInited', () => {
    it('calls callback after init completes', async () => {
      const callback = jest.fn();
      const { init } = jest.requireMock('./core');
      init.mockResolvedValueOnce(undefined);

      onInited(callback);

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(init).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('updateLocale', () => {
    it('saves locale and notifies others', () => {
      const { saveLocale } = jest.requireMock('./saving');

      // updateLocale will call window.location.reload() which throws in jsdom
      // We catch it since we only care about verifying saveLocale and sendMessage
      try {
        updateLocale('fr-FR');
      } catch {
        // reload throws in jsdom, which is expected
      }

      expect(saveLocale).toHaveBeenCalledWith('fr-FR');
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({ type: REFRESH_MSGTYPE });
    });
  });
});
