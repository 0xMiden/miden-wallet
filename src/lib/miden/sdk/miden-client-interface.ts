import { WebClient } from '@demox-labs/miden-sdk';
import { MidenWalletStorageType } from './constants';

const webClient = new WebClient();

// TODO: Refactor this, pull out to const / figure out what to point correctly at rather than a machine
await webClient.create_client('http://18.203.155.106:57291');

export const createMidenWallet = async () => {
  // Create a new wallet
  const walletId: string = await webClient.new_wallet(MidenWalletStorageType.OFF_CHAIN, true);
  console.debug('Wallet ID:', walletId);

  return walletId;
};
