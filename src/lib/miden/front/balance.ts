import { useCallback } from 'react';

import BigNumber from 'bignumber.js';

import { useRetryableSWR } from 'lib/swr';

import { MIDEN_METADATA } from '../metadata';
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
