import { WebClient } from '@demox-labs/miden-sdk';

const webClient = new WebClient();

// Use WebClient to create accounts, notes, transactions, etc.
// This will create a mutable, off-chain account and store it in IndexedDB
const accountId = await webClient.new_wallet('OffChain', true);
