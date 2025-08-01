import { MidenNetwork } from 'lib/miden/types';

export const NETWORK_STORAGE_ID = 'network_id';

export enum MIDEN_NETWORK_NAME {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  LOCALNET = 'localnet'
}

export const MIDEN_NETWORK_ENDPOINTS = new Map<string, string>([
  [MIDEN_NETWORK_NAME.MAINNET, 'https://api.miden.io'], // Placeholder
  [MIDEN_NETWORK_NAME.TESTNET, 'https://rpc.testnet.miden.io'],
  [MIDEN_NETWORK_NAME.LOCALNET, 'http://localhost:57291']
]);

export const MIDEN_PROVING_ENDPOINTS = new Map<string, string>([
  [MIDEN_NETWORK_NAME.TESTNET, 'https://tx-prover.testnet.miden.io'],
  [MIDEN_NETWORK_NAME.LOCALNET, 'http://localhost:50051']
]);

export const MIDEN_NETWORKS: MidenNetwork[] = [
  {
    rpcBaseURL: 'https://rpc.testnet.miden.io',
    id: MIDEN_NETWORK_NAME.TESTNET,
    name: 'Testnet',
    autoSync: true
  },
  { rpcBaseURL: 'localhost:57291', id: MIDEN_NETWORK_NAME.LOCALNET, name: 'Localnet', autoSync: true }
];

export enum MidenTokens {
  Miden
}

export const TOKEN_MAPPING = {
  [MidenTokens.Miden]: { faucetId: 'mtst1qppen8yngje35gr223jwe6ptjy7gedn9' }
};