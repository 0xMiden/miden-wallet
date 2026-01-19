import { transactionModalState } from './transaction-modal';

describe('transactionModalState', () => {
  beforeEach(() => {
    // Close the modal before each test to reset state
    transactionModalState.close();
  });

  describe('isOpen', () => {
    it('returns false initially', () => {
      expect(transactionModalState.isOpen()).toBe(false);
    });
  });

  describe('open', () => {
    it('opens the modal', () => {
      transactionModalState.open();
      expect(transactionModalState.isOpen()).toBe(true);
    });

    it('does not re-open if already open', () => {
      const listener = jest.fn();
      transactionModalState.subscribe(listener);
      listener.mockClear(); // Clear the initial call

      transactionModalState.open();
      expect(listener).toHaveBeenCalledTimes(1);

      transactionModalState.open(); // Try to open again
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('notifies listeners when opened', () => {
      const listener = jest.fn();
      transactionModalState.subscribe(listener);
      listener.mockClear();

      transactionModalState.open();
      expect(listener).toHaveBeenCalledWith(true);
    });
  });

  describe('close', () => {
    it('closes the modal', () => {
      transactionModalState.open();
      transactionModalState.close();
      expect(transactionModalState.isOpen()).toBe(false);
    });

    it('notifies listeners when closed', () => {
      const listener = jest.fn();
      transactionModalState.open();
      transactionModalState.subscribe(listener);
      listener.mockClear();

      transactionModalState.close();
      expect(listener).toHaveBeenCalledWith(false);
    });
  });

  describe('subscribe', () => {
    it('adds listener and returns unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = transactionModalState.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('notifies listener of current state if modal is open', () => {
      transactionModalState.open();
      const listener = jest.fn();

      transactionModalState.subscribe(listener);

      expect(listener).toHaveBeenCalledWith(true);
    });

    it('does not notify listener if modal is closed', () => {
      const listener = jest.fn();

      transactionModalState.subscribe(listener);

      expect(listener).not.toHaveBeenCalled();
    });

    it('unsubscribe removes listener', () => {
      const listener = jest.fn();
      const unsubscribe = transactionModalState.subscribe(listener);
      listener.mockClear();

      unsubscribe();

      transactionModalState.open();
      expect(listener).not.toHaveBeenCalled();
    });

    it('supports multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      transactionModalState.subscribe(listener1);
      transactionModalState.subscribe(listener2);

      transactionModalState.open();

      expect(listener1).toHaveBeenCalledWith(true);
      expect(listener2).toHaveBeenCalledWith(true);
    });
  });
});
