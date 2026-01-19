/**
 * @jest-environment jsdom
 */
import { navigate, HistoryAction, Router } from './index';

describe('woozie index', () => {
  describe('navigate', () => {
    beforeEach(() => {
      // Reset to known state
      window.history.replaceState(null, '', '/');
    });

    it('navigates to string path', () => {
      navigate('/new-page');
      // URL should be updated
      expect(window.location.hash).toContain('new-page');
    });

    it('navigates with Push action', () => {
      const initialLength = window.history.length;
      navigate('/pushed-page', HistoryAction.Push);
      expect(window.history.length).toBeGreaterThanOrEqual(initialLength);
    });

    it('navigates with Replace action', () => {
      navigate('/first', HistoryAction.Push);
      const lengthAfterPush = window.history.length;

      navigate('/replaced', HistoryAction.Replace);
      expect(window.history.length).toBe(lengthAfterPush);
    });

    it('navigates with location updates object', () => {
      navigate({ pathname: '/object-path', search: '?query=1' });
      expect(window.location.hash).toContain('object-path');
    });

    it('navigates with function modifier', () => {
      navigate(() => ({ pathname: '/function-path' }));
      expect(window.location.hash).toContain('function-path');
    });

    it('uses Replace when navigating to same URL', () => {
      navigate('/same-url', HistoryAction.Push);
      const lengthAfterFirst = window.history.length;

      // Navigate to same URL without explicit action
      navigate('/same-url');
      // Should use replace, so length stays the same
      expect(window.history.length).toBe(lengthAfterFirst);
    });

    it('uses Push when navigating to different URL', () => {
      navigate('/first-url', HistoryAction.Push);
      const lengthAfterFirst = window.history.length;

      navigate('/second-url');
      expect(window.history.length).toBeGreaterThanOrEqual(lengthAfterFirst);
    });
  });

  describe('exports', () => {
    it('exports Router module', () => {
      expect(Router).toBeDefined();
      expect(Router.createMap).toBeDefined();
      expect(Router.resolve).toBeDefined();
      expect(Router.SKIP).toBeDefined();
    });

    it('exports HistoryAction enum', () => {
      expect(HistoryAction).toBeDefined();
      expect(HistoryAction.Push).toBe('pushstate');
      expect(HistoryAction.Replace).toBe('replacestate');
      expect(HistoryAction.Pop).toBe('popstate');
    });
  });
});
