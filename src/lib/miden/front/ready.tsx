import React, { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';

import { usePassiveStorage } from 'lib/miden/front/storage';
import { WalletStatus } from 'lib/shared/types';
import { useWalletStore } from 'lib/store';

import { MidenNetwork } from '../types';

export enum ActivationStatus {
  ActivationRequestSent,
  AlreadyActivated
}

/**
 * Hook to get all networks from Zustand store
 */
export function useAllNetworks(): MidenNetwork[] {
  return useWalletStore(s => s.networks);
}

/**
 * Hook to get the network ID setter with storage persistence
 */
export function useSetNetworkId(): (id: string) => void {
  const setSelectedNetworkId = useWalletStore(s => s.setSelectedNetworkId);
  const [, setStoredNetworkId] = usePassiveStorage<string>('network_id', '');

  return useCallback(
    (id: string) => {
      setSelectedNetworkId(id);
      setStoredNetworkId(id);
    },
    [setSelectedNetworkId, setStoredNetworkId]
  );
}

/**
 * Hook to get the currently selected network
 */
export function useNetwork(): MidenNetwork {
  const networks = useWalletStore(s => s.networks);
  const selectedNetworkId = useWalletStore(s => s.selectedNetworkId);
  const setSelectedNetworkId = useWalletStore(s => s.setSelectedNetworkId);

  // Load from storage on mount and sync to store
  const defaultNet = networks[0];
  const [storedNetworkId, setStoredNetworkId] = usePassiveStorage('network_id', defaultNet?.id ?? '');

  // Sync storage to Zustand on mount
  useEffect(() => {
    if (storedNetworkId && !selectedNetworkId) {
      setSelectedNetworkId(storedNetworkId);
    }
  }, [storedNetworkId, selectedNetworkId, setSelectedNetworkId]);

  // Validate network exists, fallback to default
  useEffect(() => {
    const effectiveId = selectedNetworkId || storedNetworkId;
    if (networks.length > 0 && networks.every(n => n.id !== effectiveId)) {
      setSelectedNetworkId(defaultNet.id);
      setStoredNetworkId(defaultNet.id);
    }
  }, [networks, selectedNetworkId, storedNetworkId, setSelectedNetworkId, setStoredNetworkId, defaultNet]);

  const effectiveNetworkId = selectedNetworkId || storedNetworkId;
  return useMemo(
    () => networks.find(n => n.id === effectiveNetworkId) ?? defaultNet,
    [networks, effectiveNetworkId, defaultNet]
  );
}

/**
 * Hook to get all accounts from Zustand store
 */
export function useAllAccounts() {
  return useWalletStore(s => s.accounts);
}

/**
 * Hook to get the current account from Zustand store
 */
export function useAccount() {
  const account = useWalletStore(s => s.currentAccount);
  const selectedNetworkId = useWalletStore(s => s.selectedNetworkId);

  // Reset error boundary when account or network changes
  useLayoutEffect(() => {
    const evt = new CustomEvent('reseterrorboundary');
    window.dispatchEvent(evt);
  }, [selectedNetworkId, account?.publicKey]);

  if (!account) {
    throw new Error('No account selected');
  }

  return account;
}

/**
 * Hook to get settings from Zustand store
 */
export function useSettings() {
  const settings = useWalletStore(s => s.settings);
  if (!settings) {
    throw new Error('Settings not loaded');
  }
  return settings;
}

/**
 * Hook to get ownMnemonic flag from Zustand store
 */
export function useOwnMnemonic() {
  return useWalletStore(s => s.ownMnemonic);
}

/**
 * ReadyMidenProvider - Now a no-op since we use Zustand directly
 * Kept for backward compatibility during migration
 */
export function ReadyMidenProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
