import { useCallback } from 'react';

import { FungibleAsset } from '@demox-labs/miden-sdk';
import BigNumber from 'bignumber.js';
import { mutate } from 'swr';

import { useRetryableSWR } from 'lib/swr';

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

export function useAllBalances(address: string, tokenMetadatas: Record<string, AssetMetadata>) {
  const fetchBalancesLocal = useCallback(() => fetchBalances(address, tokenMetadatas), [address, tokenMetadatas]);

  return useRetryableSWR(getAllBalanceSWRKey(address), fetchBalancesLocal, {
    suspense: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
    dedupingInterval: 10_000,
    refreshInterval: 5_000,
    fallbackData: []
  });
}

const inFlight = new Set<string>(); // persists while this module is loaded
const prefetchMetadataIfMissing = (id: string) => {
  if (inFlight.has(id)) return;
  inFlight.add(id);
  void fetchTokenMetadata(id)
    .then(async ({ base }) => {
      await setTokensBaseMetadata({ [id]: base });
      mutate(getAllBalanceSWRKey(id)); // kick SWR now
    })
    .finally(() => inFlight.delete(id));
};

const fetchBalances = async (address: string, tokenMetadatas: Record<string, AssetMetadata>) => {
  const balances: TokenBalanceData[] = [];

  const midenClient = await getMidenClient();
  const account = await midenClient.getAccount(address);
  const assets = account!.vault().fungibleAssets() as FungibleAsset[];
  const midenFaucetId = getFaucetIdSetting();
  let hasMiden = false;

  for (const asset of assets) {
    const id = getBech32AddressFromAccountId(asset.faucetId());
    if (id !== midenFaucetId && !tokenMetadatas[id]) {
      prefetchMetadataIfMissing(id);
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
};

export function getAllBalanceSWRKey(address: string) {
  return ['allBalance', address].join('_');
}
