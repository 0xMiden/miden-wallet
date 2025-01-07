import { MidenNetwork } from 'lib/miden/types';

export enum MIDEN_NETWORK_NAME {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  LOCALNET = 'localnet'
}

export const MIDEN_NETWORK_ENDPOINTS = new Map<string, string>([
  [MIDEN_NETWORK_NAME.MAINNET, 'https://api.miden.io'], // Placeholder
  [MIDEN_NETWORK_NAME.TESTNET, 'http://18.203.155.106:57291'],
  [MIDEN_NETWORK_NAME.LOCALNET, 'http://localhost:57291']
]);

export const MIDEN_PROVING_ENDPOINTS = new Map<string, string>([
  [MIDEN_NETWORK_NAME.TESTNET, 'http://18.118.151.210:8082'],
  [MIDEN_NETWORK_NAME.LOCALNET, 'http://localhost:50051']
]);

export const MIDEN_NETWORKS: MidenNetwork[] = [
  {
    rpcBaseURL: 'TODO',
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
  [MidenTokens.Miden]: { faucetId: '0xffd01b0acbb927200000e433024f2d' }
};
