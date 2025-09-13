import { useCallback, useEffect, useMemo, useRef } from 'react';

import { FungibleAsset } from '@demox-labs/miden-sdk';
import BigNumber from 'bignumber.js';
import constate from 'constate';
import deepEqual from 'fast-deep-equal';
import Fuse from 'fuse.js';
import useForceUpdate from 'use-force-update';
import browser from 'webextension-polyfill';

import {
  MIDEN_METADATA,
  AssetMetadata,
  DetailedAssetMetdata,
  fetchFromStorage,
  fetchTokenMetadata,
  onStorageChanged,
  putToStorage,
  usePassiveStorage,
  isMidenAsset
} from 'lib/miden/front';
import { createQueue } from 'lib/queue';
import { useRetryableSWR } from 'lib/swr';

import { useGasToken } from '../../../app/hooks/useGasToken';
import { getBech32AddressFromAccountId, MidenClientInterface } from '../sdk/miden-client-interface';

export const ALL_TOKENS_BASE_METADATA_STORAGE_KEY = 'tokens_base_metadata';

const midenClient = await MidenClientInterface.create();

export type TokenBalance = {
  faucetId: string;
  balance: BigNumber;
};

export type TokenBalanceData = {
  tokens: TokenBalance[];
  totalBalance: BigNumber;
};

export function useFungibleTokens(accountId: string) {
  const fetchBalanceLocal = useCallback(async () => {
    const account = await midenClient.getAccount(accountId);
    const assets = account!.vault().fungibleAssets() as FungibleAsset[];
    const balances = assets.map(asset => ({
      faucetId: getBech32AddressFromAccountId(asset.faucetId()),
      balance: new BigNumber(asset.amount().toString()).div(10 ** MIDEN_METADATA.decimals)
    }));
    return {
      tokens: balances,
      totalBalance: balances.reduce((acc, { balance }) => acc.plus(balance), new BigNumber(0))
    } as TokenBalanceData;
  }, [accountId]);

  return useRetryableSWR([accountId, 'asset_vault'].join('_'), fetchBalanceLocal, {
    revalidateOnFocus: false,
    dedupingInterval: 20_000,
    refreshInterval: 5_000
  });
}

export function useCollectibleTokens(account: string, isDisplayed: boolean) {}

const enqueueAutoFetchMetadata = createQueue();
const autoFetchMetadataFails = new Set<string>();

export function useAssetMetadata(slug: string, assetId: string) {
  const forceUpdate = useForceUpdate();
  const { metadata } = useGasToken();

  const { allTokensBaseMetadataRef, fetchMetadata, setTokensBaseMetadata, setTokensDetailedMetadata } =
    useTokensMetadata();

  useEffect(
    () =>
      onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, newValue => {
        // TODO: Potentially update this in the future. Breaking the wallet at the moment
        if (!deepEqual(newValue[assetId], 'TODO')) {
          forceUpdate();
        }
      }),
    [slug, assetId, allTokensBaseMetadataRef, forceUpdate]
  );

  const midenAsset = isMidenAsset(slug);
  const tokenMetadata = allTokensBaseMetadataRef.current[assetId] ?? null;
  const exist = Boolean(tokenMetadata);

  useEffect(() => {
    if (!isMidenAsset(slug) && !exist && !autoFetchMetadataFails.has(assetId)) {
      enqueueAutoFetchMetadata(() => fetchMetadata(assetId))
        .then(metadata =>
          Promise.all([
            setTokensBaseMetadata({ [assetId]: metadata.base }),
            setTokensDetailedMetadata({ [assetId]: metadata.detailed })
          ])
        )
        .catch(() => autoFetchMetadataFails.add(slug));
    }
  }, [slug, assetId, exist, fetchMetadata, setTokensBaseMetadata, setTokensDetailedMetadata]);

  // MIDEN
  if (midenAsset) {
    return metadata;
  }

  return tokenMetadata!;
}

export async function useAllAssetMetadata(): Promise<Record<string, AssetMetadata>> {
  return (await fetchFromStorage(ALL_TOKENS_BASE_METADATA_STORAGE_KEY)) || defaultAllTokensBaseMetadata;
}

const defaultAllTokensBaseMetadata = {};
const enqueueSetAllTokensBaseMetadata = createQueue();

export const [TokensMetadataProvider, useTokensMetadata] = constate(() => {
  const [initialAllTokensBaseMetadata] = usePassiveStorage<Record<string, AssetMetadata>>(
    ALL_TOKENS_BASE_METADATA_STORAGE_KEY,
    defaultAllTokensBaseMetadata
  );

  const allTokensBaseMetadataRef = useRef(initialAllTokensBaseMetadata);
  useEffect(
    () =>
      onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, newValue => {
        allTokensBaseMetadataRef.current = newValue;
      }),
    []
  );

  const fetchMetadata = useCallback((assetId: string) => fetchTokenMetadata(assetId), []);

  const setTokensDetailedMetadata = useCallback(
    (toSet: Record<string, DetailedAssetMetdata>) =>
      browser.storage.local.set(mapObjectKeys(toSet, getDetailedMetadataStorageKey)),
    []
  );

  return {
    allTokensBaseMetadataRef,
    fetchMetadata,
    setTokensBaseMetadata,
    setTokensDetailedMetadata
  };
});

export async function setTokensBaseMetadata(toSet: Record<string, AssetMetadata>): Promise<void> {
  const initialAllTokensBaseMetadata: Record<string, AssetMetadata> =
    (await fetchFromStorage(ALL_TOKENS_BASE_METADATA_STORAGE_KEY)) || defaultAllTokensBaseMetadata;

  enqueueSetAllTokensBaseMetadata(() =>
    putToStorage(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, {
      ...initialAllTokensBaseMetadata,
      ...toSet
    })
  );
}

export const getTokensBaseMetadata = async (assetId: string) => {
  const allTokensBaseMetadata: Record<string, AssetMetadata> =
    (await fetchFromStorage(ALL_TOKENS_BASE_METADATA_STORAGE_KEY)) || defaultAllTokensBaseMetadata;

  return allTokensBaseMetadata[assetId];
};

export const useGetTokenMetadata = () => {
  const { allTokensBaseMetadataRef } = useTokensMetadata();
  const { metadata } = useGasToken();

  return useCallback(
    (slug: string, id: string) => {
      if (isMidenAsset(slug)) {
        return metadata;
      }

      return allTokensBaseMetadataRef.current[id];
    },
    [allTokensBaseMetadataRef, metadata]
  );
};

export function useDetailedAssetMetadata(assetSlug: string, assetId: string) {
  const baseMetadata = useAssetMetadata(assetSlug, assetId);

  const storageKey = useMemo(() => getDetailedMetadataStorageKey(assetId), [assetId]);

  const { data: detailedMetadata, mutate } = useRetryableSWR<DetailedAssetMetdata>(
    ['detailed-metadata', storageKey],
    fetchFromStorage,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  );

  useEffect(() => onStorageChanged(storageKey, mutate), [storageKey, mutate]);

  return detailedMetadata ?? baseMetadata;
}

export function useAllTokensBaseMetadata() {
  const { allTokensBaseMetadataRef } = useTokensMetadata();
  const forceUpdate = useForceUpdate();

  useEffect(() => onStorageChanged(ALL_TOKENS_BASE_METADATA_STORAGE_KEY, forceUpdate), [forceUpdate]);

  return allTokensBaseMetadataRef.current;
}

export function searchAssets(
  searchValue: string,
  assets: { slug: string; id: string }[],
  allTokensBaseMetadata: Record<string, AssetMetadata>
) {
  if (!searchValue) return assets;

  const fuse = new Fuse(
    assets.map(({ slug, id }) => ({
      slug,
      id,
      metadata: isMidenAsset(slug) ? MIDEN_METADATA : allTokensBaseMetadata[id]
    })),
    {
      keys: [
        { name: 'metadata.name', weight: 0.9 },
        { name: 'metadata.symbol', weight: 0.7 },
        { name: 'id', weight: 0.3 }
      ],
      threshold: 1
    }
  );

  return fuse.search(searchValue).map(({ item: { slug, id } }) => ({ slug, id }));
}

function getDetailedMetadataStorageKey(assetId: string) {
  return `detailed_asset_metadata_${assetId}`;
}

function mapObjectKeys<T extends Record<string, any>>(obj: T, predicate: (key: string) => string): T {
  const newObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    newObj[predicate(key)] = obj[key];
  }

  return newObj as T;
}
