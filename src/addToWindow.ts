// Import the `initialize` function from your package.
import { TridentWindowObject } from './lib/adapter/tridentWindowObject';

// Create a reference to your wallet's existing API.
const tridentWallet = new TridentWindowObject();

// // Register your wallet using the Wallet Standard, passing the reference.
// initialize(uniqueNewYork);

// Attach the reference to the window, guarding against errors.
try {
  Object.defineProperty(window, 'tridentWallet', { value: tridentWallet, writable: true });
} catch (error) {
  console.error(error);
}
