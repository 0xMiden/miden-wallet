import { MIDEN_FAUCET_ENDPOINTS, MIDEN_NETWORK_NAME } from './constants';

export function getFaucetUrl(networkId: string): string {
  return MIDEN_FAUCET_ENDPOINTS.get(networkId) ?? MIDEN_FAUCET_ENDPOINTS.get(MIDEN_NETWORK_NAME.TESTNET)!;
}
