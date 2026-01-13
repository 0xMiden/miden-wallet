import { TEMPLATE_RGX, processTemplate, areLocalesEqual, toList } from './helpers';

describe('i18n/helpers', () => {
  describe('TEMPLATE_RGX', () => {
    it('matches template variables', () => {
      expect('Hello $name$'.match(TEMPLATE_RGX)).toEqual(['$name$']);
      expect('$a$ and $b$'.match(TEMPLATE_RGX)).toEqual(['$a$', '$b$']);
    });

    it('does not match non-template text', () => {
      expect('Hello world'.match(TEMPLATE_RGX)).toBeNull();
    });
  });

  describe('processTemplate', () => {
    it('replaces simple template variables', () => {
      expect(processTemplate('Hello $name$', { name: 'World' })).toBe('Hello World');
    });

    it('replaces multiple template variables', () => {
      expect(processTemplate('$greeting$ $name$!', { greeting: 'Hello', name: 'World' })).toBe('Hello World!');
    });

    it('handles nested properties', () => {
      expect(processTemplate('$user.name$', { user: { name: 'John' } })).toBe('John');
    });

    it('returns empty string for missing values', () => {
      expect(processTemplate('Hello $missing$', {})).toBe('Hello ');
    });

    it('handles null/undefined mix', () => {
      expect(processTemplate('$key$', null)).toBe('');
      expect(processTemplate('$key$', undefined)).toBe('');
    });

    it('trims whitespace in template keys', () => {
      expect(processTemplate('$ name $', { name: 'Test' })).toBe('Test');
    });
  });

  describe('areLocalesEqual', () => {
    it('returns true for identical locales', () => {
      expect(areLocalesEqual('en', 'en')).toBe(true);
      expect(areLocalesEqual('en-US', 'en-US')).toBe(true);
    });

    it('returns true when first matches base of second', () => {
      expect(areLocalesEqual('en', 'en-US')).toBe(true);
      expect(areLocalesEqual('fr', 'fr-FR')).toBe(true);
    });

    it('returns false for different locales', () => {
      expect(areLocalesEqual('en', 'fr')).toBe(false);
      expect(areLocalesEqual('en-US', 'en-GB')).toBe(false);
    });
  });

  describe('toList', () => {
    it('wraps non-array in array', () => {
      expect(toList('item')).toEqual(['item']);
      expect(toList(123)).toEqual([123]);
      expect(toList({ key: 'value' })).toEqual([{ key: 'value' }]);
    });

    it('returns array as-is', () => {
      expect(toList(['a', 'b'])).toEqual(['a', 'b']);
      expect(toList([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('handles empty array', () => {
      expect(toList([])).toEqual([]);
    });
  });
});
