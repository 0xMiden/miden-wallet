import { useCallback } from 'react';

import BigNumber from 'bignumber.js';

import { ALEO_METADATA, AssetMetadata, useAssetMetadata } from 'lib/aleo/front';
import { useRetryableSWR } from 'lib/swr';

import { ALEO_TOKEN_ID } from '../assets/constants';

type UseBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
  refreshInterval?: number;
};

export function useBalance(
  assetSlug: string,
  assetId: string,
  opts: UseBalanceOptions = {},
  includePublic: boolean = true,
  includePrivate: boolean = true,
  unlocked: boolean = false
) {}

export interface TokenBalanceData {
  tokenId: string;
  tokenSlug: string;
  metadata: AssetMetadata;
  privateBalance: number;
  publicBalance: number;
  fiatPrice: number;
}

export function useAllBalances(
  chainId: string,
  tokenIds: string[],
  tokenMetadatas: Record<string, AssetMetadata>,
  includePublic: boolean = true,
  includePrivate: boolean = true,
  unlocked: boolean = false
) {}

const fetchBalances = async (
  tokenIds: string[],
  tokenMetadatas: Record<string, AssetMetadata>,
  includePublic: boolean = true,
  includePrivate: boolean = true,
  unlocked: boolean = false
) => {};

export const useOwnedRecords = () => {};

export const useUnspentAleoRecords = () => {};

export function useFee() {}

export function useBalanceSWRKey(
  assetSlug: string,
  address: string,
  includePublic: boolean,
  includePrivate: boolean,
  unlocked: boolean
) {
  return getBalanceSWRKey(assetSlug, address, includePublic, includePrivate, unlocked);
}

export function getBalanceSWRKey(
  assetSlug: string,
  address: string,
  includePublic: boolean,
  includePrivate: boolean,
  unlocked: boolean
) {
  return ['balance', assetSlug, address, includePublic, includePrivate, unlocked].join('_');
}

export function getAllBalanceSWRKey(
  address: string,
  chainId: string,
  includePublic: boolean,
  includePrivate: boolean,
  unlocked: boolean
) {
  return ['allBalance', address, chainId, includePublic, includePrivate, unlocked].join('_');
}
