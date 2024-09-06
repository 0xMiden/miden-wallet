import { useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';

import { searchAssets, useAllTokensBaseMetadata } from 'lib/aleo/front';

import { Asset, Token, FA2Token } from './types';

export async function toTransferParams(assetSlug: string, toPublicKey: string, amount: BigNumber.Value) {
  const asset = assetSlug;

  if (isAleoAsset(asset)) {
    return {
      to: toPublicKey,
      amount: amount as any
    };
  } else {
    return {
      to: 'not a public key',
      amount: 420
    };
  }
}

export function toTokenSlug(contract: string, id: BigNumber.Value = 0) {
  return contract === 'aleo' ? 'aleo' : `${contract}_${new BigNumber(id).toFixed()}`;
}

export function isFA2Token(token: Token): token is FA2Token {
  return typeof token.id !== 'undefined';
}

export function isAleoAsset(asset: Asset | string): asset is 'aleo' {
  return asset === 'aleo';
}

export function isTokenAsset(asset: Asset): asset is Token {
  return asset !== 'aleo';
}

export function useFilteredAssets(assets: { slug: string; id: string }[]) {
  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const [searchValue, setSearchValue] = useState('');
  const [tokenId, setTokenId] = useState<number>();
  const [searchValueDebounced] = useDebounce(tokenId ? toTokenSlug(searchValue, tokenId) : searchValue, 300);

  const filteredAssets = useMemo(
    () => searchAssets(searchValueDebounced, assets, allTokensBaseMetadata),
    [searchValueDebounced, assets, allTokensBaseMetadata]
  );

  return {
    filteredAssets,
    searchValue,
    setSearchValue,
    tokenId,
    setTokenId
  };
}

function useDebounce(arg0: string, arg1: number): [any] {
  throw new Error('Function not implemented.');
}
