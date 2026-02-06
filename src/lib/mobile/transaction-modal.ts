// Simple state management for mobile transaction modal
type Listener = (isOpen: boolean) => void;

let isModalOpen = false;
const listeners: Set<Listener> = new Set();

// Module instance ID for debugging duplicate module issues
const moduleId = Math.random().toString(36).substring(7);

export const transactionModalState = {
  open: () => {
    // Don't re-open if already open
    if (isModalOpen) {
      return;
    }
    isModalOpen = true;
    listeners.forEach(listener => listener(true));
  },
  close: () => {
    isModalOpen = false;
    listeners.forEach(listener => listener(false));
  },
  isOpen: () => isModalOpen,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    // Immediately notify listener of current state to avoid race conditions
    if (isModalOpen) {
      listener(true);
    }
    return () => {
      listeners.delete(listener);
    };
  }
};
