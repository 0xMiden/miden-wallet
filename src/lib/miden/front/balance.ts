import { AssetMetadata } from '../metadata';
import { useBalancesSdk } from '../sdk-bridge/useBalancesSdk';

export interface TokenBalanceData {
  tokenId: string;
  tokenSlug: string;
  metadata: AssetMetadata;
  balance: number;
  fiatPrice: number;
}

/**
 * useAllBalances - Hook to get all token balances for an account
 *
 * Delegates to the SDK's `useAccount()` via the `useBalancesSdk` adapter.
 * The SDK handles sync, IndexedDB reads, and metadata fetching internally.
 * No polling or WASM client locks needed on the wallet side.
 */
export function useAllBalances(address: string, tokenMetadatas: Record<string, AssetMetadata>) {
  return useBalancesSdk(address, tokenMetadatas);
}
