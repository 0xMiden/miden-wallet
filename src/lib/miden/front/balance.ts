import { useCallback } from 'react';

import { AccountInterface, FungibleAsset, NetworkId } from '@demox-labs/miden-sdk';
import BigNumber from 'bignumber.js';

import { useRetryableSWR } from 'lib/swr';

import { getFaucetIdSetting } from '../assets';
import { AssetMetadata, MIDEN_METADATA } from '../metadata';
import { accountIdStringToSdk, MidenClientInterface } from '../sdk/miden-client-interface';

type UseBalanceOptions = {
  suspense?: boolean;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
  refreshInterval?: number;
};

const midenClient = await MidenClientInterface.create();

export function useBalance(accountId: string, faucetId: string, opts: UseBalanceOptions = {}) {
  const fetchBalanceLocal = useCallback(async () => {
    const account = await midenClient.getAccount(accountId);
    const balance = account!.vault().getBalance(accountIdStringToSdk(faucetId));
    let balanceNumber = new BigNumber(balance.toString());
    balanceNumber = balanceNumber.isNaN() ? new BigNumber(0) : balanceNumber;
    return balanceNumber.div(10 ** MIDEN_METADATA.decimals);
  }, [accountId, faucetId]);

  return useRetryableSWR([accountId, faucetId].join('_'), fetchBalanceLocal, {
    revalidateOnFocus: false,
    dedupingInterval: 20_000,
    refreshInterval: 5_000
  });
}

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

const fetchBalances = async (address: string, tokenMetadatas: Record<string, AssetMetadata>) => {
  const balances: TokenBalanceData[] = [];

  const account = await midenClient.getAccount(address);
  const assets = account!.vault().fungibleAssets() as FungibleAsset[];
  const midenFaucetId = getFaucetIdSetting();
  let hasMiden = false;
  for (const asset of assets) {
    const tokenId = asset.faucetId().toBech32(NetworkId.Devnet, AccountInterface.BasicWallet);
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

export function useBalanceSWRKey(assetSlug: string, address: string) {
  return getBalanceSWRKey(assetSlug, address);
}

export function getBalanceSWRKey(assetSlug: string, address: string) {
  return ['balance', assetSlug, address].join('_');
}

export function getAllBalanceSWRKey(address: string) {
  return ['allBalance', address].join('_');
}
