// Simple state management for mobile transaction modal
type Listener = (isOpen: boolean) => void;

let isModalOpen = false;
const listeners: Set<Listener> = new Set();

export const transactionModalState = {
  open: () => {
    console.log('[TransactionModal] Opening modal');
    isModalOpen = true;
    listeners.forEach(listener => listener(true));
  },
  close: () => {
    console.log('[TransactionModal] Closing modal');
    isModalOpen = false;
    listeners.forEach(listener => listener(false));
  },
  isOpen: () => isModalOpen,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};
