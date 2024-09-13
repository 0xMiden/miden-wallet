import { MidenNetwork } from 'lib/miden/types';

export enum MIDEN_NETWORK_NAME {
  MAINNET = 'mainnet',
  TESTNET = 'testnet'
}

export const MIDEN_NETWORK_ENDPOINTS = new Map<string, string>([
  [MIDEN_NETWORK_NAME.MAINNET, 'https://api.miden.io'], // Placeholder
  [MIDEN_NETWORK_NAME.TESTNET, 'https://testnet.miden.io/']
]);

export const MIDEN_NETWORKS: MidenNetwork[] = [
  {
    rpcBaseURL: 'TODO',
    id: MIDEN_NETWORK_NAME.TESTNET
  }
];
