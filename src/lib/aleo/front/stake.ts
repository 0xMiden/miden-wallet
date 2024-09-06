import { useCallback } from 'react';

import BigNumber from 'bignumber.js';

import { useAssetMetadata } from 'lib/aleo/front';
import { useRetryableSWR } from 'lib/swr';

type UseStakedBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
  refreshInterval?: number;
};

export function useStakedBalance(
  chainId: string,
  assetSlug: string,
  assetId: string,
  opts: UseStakedBalanceOptions = {}
) {}

export function useStakedBalanceSWRKey(assetSlug: string, address: string) {}

export function getStakedBalanceSWRKey(assetSlug: string, address: string) {}

type UseUnstakedBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
  refreshInterval?: number;
};

export function useUnstakedBalance() {}

export function useUnstakedBalanceSWRKey(assetSlug: string, address: string) {}

export function getUnstakedBalanceSWRKey(assetSlug: string, address: string) {}
