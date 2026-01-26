import { useEffect, useRef } from 'react';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { fetchingAddresses } from 'lib/miden/front/balance';

import { useWalletStore } from '../index';
import { fetchBalances } from '../utils/fetchBalances';

/**
 * Prefetch balances as soon as the current account is known.
 * This runs early in the app lifecycle so balances are ready
 * by the time the user sees the Explore page.
 */
export function usePrefetchBalances() {
  const currentAccount = useWalletStore(s => s.currentAccount);
  const assetsMetadata = useWalletStore(s => s.assetsMetadata);
  const setAssetsMetadata = useWalletStore(s => s.setAssetsMetadata);
  const balancesLastFetched = useWalletStore(s => s.balancesLastFetched);
  const network = useWalletStore(s => s.selectedNetworkId);
  // Track if we've already started prefetching for this account
  const prefetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentAccount) return;

    const address = currentAccount.accountId;

    // Don't prefetch if we already have recent data or already prefetched
    if (prefetchedRef.current === address) return;
    if (balancesLastFetched[address] && Date.now() - balancesLastFetched[address] < 5000) return;

    // Check global lock - another component might already be fetching
    if (fetchingAddresses.has(address)) return;

    prefetchedRef.current = address;

    // Acquire global lock and set timestamp BEFORE starting fetch
    // This prevents useAllBalances from also starting a fetch
    fetchingAddresses.add(address);
    useWalletStore.setState(state => ({
      balancesLastFetched: { ...state.balancesLastFetched, [address]: Date.now() }
    }));

    // Prefetch in background - don't block anything
    fetchBalances(network as MIDEN_NETWORK_NAME, address, assetsMetadata, { setAssetsMetadata })
      .then(balances => {
        useWalletStore.setState(state => ({
          balances: { ...state.balances, [address]: balances },
          balancesLastFetched: { ...state.balancesLastFetched, [address]: Date.now() }
        }));
      })
      .catch(err => {
        console.warn('Balance prefetch failed:', err);
        // Reset timestamp so other hooks can retry
        useWalletStore.setState(state => ({
          balancesLastFetched: { ...state.balancesLastFetched, [address]: 0 }
        }));
      })
      .finally(() => {
        // Release global lock
        fetchingAddresses.delete(address);
      });
  }, [currentAccount, assetsMetadata, setAssetsMetadata, balancesLastFetched]);
}
