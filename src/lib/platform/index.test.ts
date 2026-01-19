// Test platform detection utilities
// Note: These tests need to be run in isolation since the module caches Capacitor

describe('platform detection', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('isExtension', () => {
    it('returns true when browser.runtime.id exists', () => {
      (globalThis as any).browser = { runtime: { id: 'test-extension-id' } };

      const { isExtension } = require('./index');
      expect(isExtension()).toBe(true);

      delete (globalThis as any).browser;
    });

    it('returns false when browser is undefined', () => {
      delete (globalThis as any).browser;

      const { isExtension } = require('./index');
      expect(isExtension()).toBe(false);
    });

    it('returns false when browser.runtime is undefined', () => {
      (globalThis as any).browser = {};

      const { isExtension } = require('./index');
      expect(isExtension()).toBe(false);

      delete (globalThis as any).browser;
    });

    it('returns false when browser.runtime.id is undefined', () => {
      (globalThis as any).browser = { runtime: {} };

      const { isExtension } = require('./index');
      expect(isExtension()).toBe(false);

      delete (globalThis as any).browser;
    });
  });

  describe('isCapacitor', () => {
    it('returns false when Capacitor is not available', () => {
      jest.doMock('@capacitor/core', () => {
        throw new Error('Module not found');
      });

      const { isCapacitor } = require('./index');
      expect(isCapacitor()).toBe(false);
    });
  });

  describe('isMobile', () => {
    it('returns false when not on mobile', () => {
      jest.doMock('@capacitor/core', () => {
        throw new Error('Module not found');
      });

      const { isMobile } = require('./index');
      expect(isMobile()).toBe(false);
    });
  });

  describe('isIOS', () => {
    it('returns false when Capacitor is not available', () => {
      jest.doMock('@capacitor/core', () => {
        throw new Error('Module not found');
      });

      const { isIOS } = require('./index');
      expect(isIOS()).toBe(false);
    });
  });

  describe('isAndroid', () => {
    it('returns false when Capacitor is not available', () => {
      jest.doMock('@capacitor/core', () => {
        throw new Error('Module not found');
      });

      const { isAndroid } = require('./index');
      expect(isAndroid()).toBe(false);
    });
  });

  describe('getPlatform', () => {
    it('returns extension when in extension context', () => {
      jest.doMock('@capacitor/core', () => {
        throw new Error('Module not found');
      });
      (globalThis as any).browser = { runtime: { id: 'test-id' } };

      const { getPlatform } = require('./index');
      expect(getPlatform()).toBe('extension');

      delete (globalThis as any).browser;
    });

    it('returns web when not in extension or mobile', () => {
      jest.doMock('@capacitor/core', () => {
        throw new Error('Module not found');
      });
      delete (globalThis as any).browser;

      const { getPlatform } = require('./index');
      expect(getPlatform()).toBe('web');
    });
  });

  describe('platform object', () => {
    it('exports all detection functions', () => {
      const { platform } = require('./index');

      expect(typeof platform.isCapacitor).toBe('function');
      expect(typeof platform.isExtension).toBe('function');
      expect(typeof platform.isIOS).toBe('function');
      expect(typeof platform.isAndroid).toBe('function');
      expect(typeof platform.isMobile).toBe('function');
      expect(typeof platform.getPlatform).toBe('function');
    });
  });

  describe('with mocked Capacitor', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('isCapacitor returns true when Capacitor reports native platform', () => {
      jest.doMock('@capacitor/core', () => ({
        Capacitor: {
          isNativePlatform: () => true,
          getPlatform: () => 'ios'
        }
      }));

      const { isCapacitor } = require('./index');
      expect(isCapacitor()).toBe(true);
    });

    it('isIOS returns true when platform is ios', () => {
      jest.doMock('@capacitor/core', () => ({
        Capacitor: {
          isNativePlatform: () => true,
          getPlatform: () => 'ios'
        }
      }));

      const { isIOS } = require('./index');
      expect(isIOS()).toBe(true);
    });

    it('isAndroid returns true when platform is android', () => {
      jest.doMock('@capacitor/core', () => ({
        Capacitor: {
          isNativePlatform: () => true,
          getPlatform: () => 'android'
        }
      }));

      const { isAndroid } = require('./index');
      expect(isAndroid()).toBe(true);
    });

    it('getPlatform returns mobile when on native platform', () => {
      jest.doMock('@capacitor/core', () => ({
        Capacitor: {
          isNativePlatform: () => true,
          getPlatform: () => 'ios'
        }
      }));

      const { getPlatform } = require('./index');
      expect(getPlatform()).toBe('mobile');
    });
  });
});
