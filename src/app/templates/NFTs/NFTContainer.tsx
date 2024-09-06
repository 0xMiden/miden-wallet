import React, { RefObject, memo, useEffect, useMemo, useState } from 'react';

import { NFT_PAGE_SIZE } from 'app/defaults';

import { useAccount } from 'lib/aleo/front';
import { useRetryableSWR } from 'lib/swr';
import useSafeState from 'lib/ui/useSafeState';

import { INFT } from './INFT';
import NFTView from './NFTView';

type NFTsContainerProps = {
  address: string;
  scrollParentRef?: RefObject<HTMLDivElement>;
  setNFTNumber: (nftNumber: number) => void;
};

const NFTContainer = memo<NFTsContainerProps>(({ address, scrollParentRef, setNFTNumber }) => {
  const account = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { data: latestNFTs, isValidating: fetching } = useRetryableSWR(
    [`latest-NFTs`, address],
    async () => getNfts(),
    {
      revalidateOnMount: true,
      refreshInterval: 15_000,
      dedupingInterval: 3_000
    }
  );

  const getNfts = async () => {
    let privateNFTs: INFT[] = [];
    let publicNFTs: INFT[] = [];
    try {
    } catch (err) {
      console.log('Failed to fetch private NFTs: ', err);
    }
    try {
    } catch (err) {
      console.log('Failed to fetch public NFTs: ', err);
    }

    return [...privateNFTs, ...publicNFTs];
  };

  const loadMore = async (page: number) => {
    // already loading, don't make duplicate calls
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const offset = NFT_PAGE_SIZE * page;
    const limit = NFT_PAGE_SIZE;
    setIsLoading(false);
  };

  return (
    <NFTView
      nfts={[]}
      initialLoading={fetching}
      loadMore={loadMore}
      hasMore={hasMore}
      scrollParentRef={scrollParentRef}
    />
  );
});

export default NFTContainer;

function mergeAndSort(base?: INFT[], toAppend: INFT[] = []) {
  if (!base) return [];

  const uniqueKeys = new Set<string>();
  const uniques: INFT[] = [];
  for (const nft of [...base, ...toAppend]) {
    if (!uniqueKeys.has(nft.transactionId)) {
      uniqueKeys.add(nft.transactionId);
      uniques.push(nft);
    }
  }
  uniques.sort((r1, r2) => r2.timestamp - r1.timestamp);
  return uniques;
}
