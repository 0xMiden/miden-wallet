import { useCallback, useEffect, useRef } from 'react';

import { useWalletStore } from 'lib/store';
import { fetchBalances } from 'lib/store/utils/fetchBalances';

import { AssetMetadata } from '../metadata';

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
      // Fetch balances using the consolidated utility
      const fetchedBalances = await fetchBalances(address, tokenMetadatas, { setAssetsMetadata });

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

// Keep for backward compatibility with any code that might use this
export function getAllBalanceSWRKey(address: string) {
  return ['allBalance', address].join('_');
}
