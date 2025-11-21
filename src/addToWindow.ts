// Import the `initialize` function from your package.
import { MidenWindowObject } from './lib/adapter/midenWindowObject';

// Create a reference to your wallet's existing API.
const midenWallet = new MidenWindowObject();

// // Register your wallet using the Wallet Standard, passing the reference.
// initialize(uniqueNewYork);

// Attach the reference to the window, guarding against errors.
try {
  console.log('Adding midenWallet to window');
  Object.defineProperty(window, 'midenWallet', { value: midenWallet, writable: true });
} catch (error) {
  console.error(error);
}
