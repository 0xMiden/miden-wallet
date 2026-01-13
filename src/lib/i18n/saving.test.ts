import { STORAGE_KEY, getSavedLocale, saveLocale } from './saving';

describe('i18n/saving', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('STORAGE_KEY', () => {
    it('should be "locale"', () => {
      expect(STORAGE_KEY).toBe('locale');
    });
  });

  describe('getSavedLocale', () => {
    it('returns null when no locale is saved', () => {
      expect(getSavedLocale()).toBeNull();
    });

    it('returns saved locale', () => {
      localStorage.setItem(STORAGE_KEY, 'en-US');
      expect(getSavedLocale()).toBe('en-US');
    });
  });

  describe('saveLocale', () => {
    it('saves locale to localStorage', () => {
      saveLocale('fr-FR');
      expect(localStorage.getItem(STORAGE_KEY)).toBe('fr-FR');
    });

    it('overwrites existing locale', () => {
      saveLocale('en-US');
      saveLocale('de-DE');
      expect(localStorage.getItem(STORAGE_KEY)).toBe('de-DE');
    });

    it('handles localStorage errors gracefully', () => {
      const mockSetItem = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Storage full');
      });

      expect(() => saveLocale('en-US')).not.toThrow();
      mockSetItem.mockRestore();
    });
  });
});
