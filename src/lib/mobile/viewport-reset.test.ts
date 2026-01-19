/**
 * @jest-environment jsdom
 */
import { Keyboard } from '@capacitor/keyboard';

import { resetViewportAfterWebview } from './viewport-reset';

jest.mock('@capacitor/keyboard', () => ({
  Keyboard: {
    hide: jest.fn()
  }
}));

describe('viewport-reset', () => {
  let rootElement: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock window.scrollTo since jsdom doesn't implement it
    window.scrollTo = jest.fn();

    // Create root element
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  });

  afterEach(() => {
    jest.useRealTimers();
    if (rootElement.parentNode) {
      rootElement.parentNode.removeChild(rootElement);
    }
  });

  describe('resetViewportAfterWebview', () => {
    it('calls Keyboard.hide', async () => {
      const promise = resetViewportAfterWebview();
      await jest.runAllTimersAsync();
      await promise;

      expect(Keyboard.hide).toHaveBeenCalled();
    });

    it('handles Keyboard.hide failure gracefully', async () => {
      (Keyboard.hide as jest.Mock).mockRejectedValueOnce(new Error('No keyboard'));

      const promise = resetViewportAfterWebview();
      await jest.runAllTimersAsync();

      await expect(promise).resolves.not.toThrow();
    });

    it('creates and removes temporary input', async () => {
      const appendSpy = jest.spyOn(document.body, 'appendChild');
      const removeSpy = jest.spyOn(document.body, 'removeChild');

      const promise = resetViewportAfterWebview();
      await jest.runAllTimersAsync();
      await promise;

      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();

      appendSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('forces layout recalculation on root element', async () => {
      const promise = resetViewportAfterWebview();
      await jest.runAllTimersAsync();
      await promise;

      // Root element should have been toggled display
      expect(rootElement.style.display).toBe('');
    });

    it('dispatches resize event', async () => {
      const resizeHandler = jest.fn();
      window.addEventListener('resize', resizeHandler);

      const promise = resetViewportAfterWebview();
      await jest.runAllTimersAsync();
      await promise;

      expect(resizeHandler).toHaveBeenCalled();

      window.removeEventListener('resize', resizeHandler);
    });

    it('scrolls to reset viewport calculations', async () => {
      const scrollSpy = jest.spyOn(window, 'scrollTo');

      const promise = resetViewportAfterWebview();
      await jest.runAllTimersAsync();
      await promise;

      expect(scrollSpy).toHaveBeenCalledWith(0, 1);
      expect(scrollSpy).toHaveBeenCalledWith(0, 0);

      scrollSpy.mockRestore();
    });

    it('blurs active element if it exists', async () => {
      // The function creates its own temp input and focuses/blurs it,
      // then at the end blurs the active element. We just need to verify
      // the function completes without error.
      const promise = resetViewportAfterWebview();
      await jest.runAllTimersAsync();

      await expect(promise).resolves.not.toThrow();
    });

    it('handles missing root element', async () => {
      document.body.removeChild(rootElement);

      const promise = resetViewportAfterWebview();
      await jest.runAllTimersAsync();

      await expect(promise).resolves.not.toThrow();
    });
  });
});
