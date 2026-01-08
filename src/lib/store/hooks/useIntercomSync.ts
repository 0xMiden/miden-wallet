import { useEffect, useRef } from 'react';

import { MidenState } from 'lib/miden/types';
import { WalletMessageType, WalletNotification } from 'lib/shared/types';
import { retryWithTimeout } from 'lib/utility/retry';

import { getIntercom, useWalletStore } from '../index';

/**
 * Hook that sets up synchronization between the Zustand store and the backend.
 * Should be used once at the root of the app.
 */
export function useIntercomSync() {
  const syncFromBackend = useWalletStore(s => s.syncFromBackend);
  const isInitialized = useWalletStore(s => s.isInitialized);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    // Fetch initial state
    const fetchInitialState = async () => {
      if (initialFetchDone.current) return;
      initialFetchDone.current = true;

      try {
        const state = await fetchStateFromBackend(5);
        syncFromBackend(state);
      } catch (error) {
        console.error('Failed to fetch initial state:', error);
        initialFetchDone.current = false; // Allow retry
      }
    };

    fetchInitialState();
  }, [syncFromBackend]);

  useEffect(() => {
    // Subscribe to state updates from backend
    const intercom = getIntercom();

    const unsubscribe = intercom.subscribe((msg: WalletNotification) => {
      if (msg?.type === WalletMessageType.StateUpdated) {
        // Refetch state when backend notifies of changes
        fetchStateFromBackend(0)
          .then(syncFromBackend)
          .catch(error => console.error('Failed to sync state:', error));
      }
    });

    return unsubscribe;
  }, [syncFromBackend]);

  return isInitialized;
}

/**
 * Fetch state from backend with retry logic
 */
async function fetchStateFromBackend(maxRetries: number = 0): Promise<MidenState> {
  const intercom = getIntercom();

  const res = await retryWithTimeout(
    async () => {
      const res = await intercom.request({ type: WalletMessageType.GetStateRequest });
      if (res?.type !== WalletMessageType.GetStateResponse) {
        throw new Error('Invalid response type');
      }
      return res;
    },
    3_000,
    maxRetries
  );

  return res.state;
}

export { fetchStateFromBackend };
