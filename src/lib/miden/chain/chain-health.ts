import { useCallback } from 'react';

import { useRetryableSWR } from 'lib/swr';

import { MonitorServiceClient } from './monitor-service-client';

export type Network = 'testnet' | 'localnet';
const CHAIN_HEALTH_SWR_KEY = 'chain-health';

export const useChainHealth = (network: Network = 'testnet') => {
  const fetchHealth = useCallback(async () => {
    return await MonitorServiceClient.healthCheck();
  }, []);

  return useRetryableSWR([network, CHAIN_HEALTH_SWR_KEY].join('_'), fetchHealth, {
    refreshInterval: 30000,
    dedupingInterval: 5000
  });
};
