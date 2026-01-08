import { useCallback, useEffect, useRef } from 'react';

import { FungibleAsset } from '@demox-labs/miden-sdk';
import BigNumber from 'bignumber.js';

import { useWalletStore } from 'lib/store';

import { getFaucetIdSetting } from '../assets';
import { AssetMetadata, fetchTokenMetadata, MIDEN_METADATA } from '../metadata';
import { getBech32AddressFromAccountId } from '../sdk/helpers';
import { getMidenClient } from '../sdk/miden-client';
import { setTokensBaseMetadata } from './assets';

export interface TokenBalanceData {
  tokenId: string;
  tokenSlug: string;
  metadata: AssetMetadata;
  balance: number;
  fiatPrice: number;
}

const REFRESH_INTERVAL = 5_000;
const DEDUPING_INTERVAL = 10_000;

/**
 * useAllBalances - Hook to get all token balances for an account
 *
 * Now uses Zustand store for state management while maintaining
 * the same return signature for backward compatibility.
 */
export function useAllBalances(address: string, tokenMetadatas: Record<string, AssetMetadata>) {
  // Get state and actions from Zustand store
  const balances = useWalletStore(s => s.balances[address] ?? []);
  const balancesLoading = useWalletStore(s => s.balancesLoading[address] ?? false);
  const balancesLastFetched = useWalletStore(s => s.balancesLastFetched[address] ?? 0);
  const setAssetsMetadata = useWalletStore(s => s.setAssetsMetadata);

  // Track if component is mounted
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  // Fetch balances function that respects deduping
  const fetchBalancesWithDeduping = useCallback(async () => {
    if (fetchingRef.current) return;

    const now = Date.now();
    if (now - balancesLastFetched < DEDUPING_INTERVAL) {
      return;
    }

    fetchingRef.current = true;
    try {
      // Fetch balances and prefetch missing metadata
      const fetchedBalances = await fetchBalancesRaw(address, tokenMetadatas, setAssetsMetadata);

      // Update store if still mounted
      if (mountedRef.current) {
        useWalletStore.setState(state => ({
          balances: { ...state.balances, [address]: fetchedBalances },
          balancesLoading: { ...state.balancesLoading, [address]: false },
          balancesLastFetched: { ...state.balancesLastFetched, [address]: Date.now() }
        }));
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
      if (mountedRef.current) {
        useWalletStore.setState(state => ({
          balancesLoading: { ...state.balancesLoading, [address]: false }
        }));
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [address, tokenMetadatas, balancesLastFetched, setAssetsMetadata]);

  // Manual mutate function for compatibility
  const mutate = useCallback(() => {
    // Reset last fetched time to force a refresh
    useWalletStore.setState(state => ({
      balancesLastFetched: { ...state.balancesLastFetched, [address]: 0 }
    }));
    return fetchBalancesWithDeduping();
  }, [address, fetchBalancesWithDeduping]);

  // Initial fetch and polling
  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchBalancesWithDeduping();

    // Set up polling interval
    const intervalId = setInterval(() => {
      if (mountedRef.current) {
        fetchBalancesWithDeduping();
      }
    }, REFRESH_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchBalancesWithDeduping]);

  // Return SWR-compatible shape for backward compatibility
  return {
    data: balances,
    mutate,
    isLoading: balancesLoading,
    isValidating: balancesLoading
  };
}

const inFlight = new Set<string>(); // persists while this module is loaded

const prefetchMetadataIfMissing = (
  id: string,
  setAssetsMetadata: (metadata: Record<string, AssetMetadata>) => void
) => {
  if (inFlight.has(id)) return;
  inFlight.add(id);
  void fetchTokenMetadata(id)
    .then(async ({ base }) => {
      await setTokensBaseMetadata({ [id]: base });
      setAssetsMetadata({ [id]: base });
    })
    .finally(() => inFlight.delete(id));
};

/**
 * Raw balance fetching logic - used by both the hook and the store
 */
async function fetchBalancesRaw(
  address: string,
  tokenMetadatas: Record<string, AssetMetadata>,
  setAssetsMetadata: (metadata: Record<string, AssetMetadata>) => void
): Promise<TokenBalanceData[]> {
  const balances: TokenBalanceData[] = [];

  const midenClient = await getMidenClient();
  const account = await midenClient.getAccount(address);
  const assets = account!.vault().fungibleAssets() as FungibleAsset[];
  const midenFaucetId = await getFaucetIdSetting();
  let hasMiden = false;

  for (const asset of assets) {
    const id = getBech32AddressFromAccountId(asset.faucetId());
    if (id !== midenFaucetId && !tokenMetadatas[id]) {
      prefetchMetadataIfMissing(id, setAssetsMetadata);
    }
  }

  for (const asset of assets) {
    const tokenId = getBech32AddressFromAccountId(asset.faucetId());
    const isMiden = tokenId === midenFaucetId;
    if (isMiden) {
      hasMiden = true;
    }
    const tokenMetadata = isMiden ? MIDEN_METADATA : tokenMetadatas[tokenId];
    if (!tokenMetadata) {
      continue;
    }
    const balance = new BigNumber(asset.amount().toString()).div(10 ** tokenMetadata.decimals);
    balances.push({
      tokenId,
      tokenSlug: tokenMetadata.symbol,
      metadata: tokenMetadata,
      fiatPrice: 1,
      balance: balance.toNumber()
    });
  }

  if (!hasMiden) {
    balances.push({
      tokenId: midenFaucetId,
      tokenSlug: 'MIDEN',
      metadata: MIDEN_METADATA,
      fiatPrice: 1,
      balance: 0
    });
  }

  return balances;
}

// Keep for backward compatibility with any code that might use this
export function getAllBalanceSWRKey(address: string) {
  return ['allBalance', address].join('_');
}
