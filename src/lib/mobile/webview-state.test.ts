import { setReturningFromWebview, isReturningFromWebview, markReturningFromWebview } from './webview-state';

describe('webview-state', () => {
  beforeEach(() => {
    // Reset state
    setReturningFromWebview(false);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('setReturningFromWebview', () => {
    it('sets the returning state to true', () => {
      setReturningFromWebview(true);
      expect(isReturningFromWebview()).toBe(true);
    });

    it('sets the returning state to false', () => {
      setReturningFromWebview(true);
      setReturningFromWebview(false);
      expect(isReturningFromWebview()).toBe(false);
    });
  });

  describe('isReturningFromWebview', () => {
    it('returns false initially', () => {
      expect(isReturningFromWebview()).toBe(false);
    });

    it('returns current state', () => {
      expect(isReturningFromWebview()).toBe(false);
      setReturningFromWebview(true);
      expect(isReturningFromWebview()).toBe(true);
    });
  });

  describe('markReturningFromWebview', () => {
    it('sets returning state to true', () => {
      markReturningFromWebview();
      expect(isReturningFromWebview()).toBe(true);
    });

    it('auto-clears after 300ms', () => {
      markReturningFromWebview();
      expect(isReturningFromWebview()).toBe(true);

      jest.advanceTimersByTime(299);
      expect(isReturningFromWebview()).toBe(true);

      jest.advanceTimersByTime(1);
      expect(isReturningFromWebview()).toBe(false);
    });
  });
});
