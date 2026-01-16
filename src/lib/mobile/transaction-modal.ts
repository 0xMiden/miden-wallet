// Simple state management for mobile transaction modal
type Listener = (isOpen: boolean) => void;

let isModalOpen = false;
const listeners: Set<Listener> = new Set();

// Module instance ID for debugging duplicate module issues
const moduleId = Math.random().toString(36).substring(7);
console.log('[TransactionModal] Module loaded, instanceId:', moduleId);

export const transactionModalState = {
  open: () => {
    // Don't re-open if already open
    if (isModalOpen) {
      console.log('[TransactionModal] Modal already open, skipping. instanceId:', moduleId);
      return;
    }
    console.log('[TransactionModal] Opening modal, listeners:', listeners.size, 'instanceId:', moduleId);
    isModalOpen = true;
    listeners.forEach(listener => listener(true));
  },
  close: () => {
    console.log('[TransactionModal] Closing modal, instanceId:', moduleId);
    console.log('[TransactionModal] Close call stack:', new Error().stack);
    isModalOpen = false;
    listeners.forEach(listener => listener(false));
  },
  isOpen: () => isModalOpen,
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    console.log('[TransactionModal] Subscribed, total listeners:', listeners.size, 'instanceId:', moduleId);
    return () => {
      listeners.delete(listener);
      console.log('[TransactionModal] Unsubscribed, remaining listeners:', listeners.size, 'instanceId:', moduleId);
    };
  }
};
