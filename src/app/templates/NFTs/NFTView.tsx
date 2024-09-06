import React, { memo, RefObject } from 'react';

import classNames from 'clsx';
import InfiniteScroll from 'react-infinite-scroller';

import { ActivitySpinner } from 'app/atoms/ActivitySpinner';
import { ReactComponent as PictureIcon } from 'app/icons/picture.svg';
import { T } from 'lib/i18n/react';

import { INFT } from './INFT';
import NFTItem from './NFTItem';

type NFTViewProps = {
  nfts: INFT[];
  initialLoading: boolean;
  loadMore: (page: number) => Promise<void>;
  hasMore: boolean;
  scrollParentRef?: RefObject<HTMLDivElement>;
  fullHistory?: boolean;
  className?: string;
};

const NFTView = memo<NFTViewProps>(
  ({ nfts, initialLoading, loadMore, hasMore, scrollParentRef, fullHistory, className }) => {
    const noActivities = nfts.length === 0;
    const noOperationsClass = fullHistory
      ? 'mt-8 items-center text-left text-black'
      : 'm-2 items-start text-left text-black';

    if (noActivities) {
      return initialLoading ? (
        <ActivitySpinner />
      ) : (
        <div
          style={{ height: '85%' }}
          className={classNames('mb-12', 'flex flex-col items-center justify-center', noOperationsClass)}
        >
          <PictureIcon
            height={'48px'}
            width={'48px'}
            style={{
              cursor: 'pointer'
            }}
          />
          <h3 className="font-medium text-lg text-left" style={{ maxWidth: '20rem' }}>
            <T id="noNFTsYet" />
          </h3>
          <span>
            <T id="noNFTsSubMessage" />
          </span>
        </div>
      );
    }

    return (
      <>
        <InfiniteScroll
          loadMore={loadMore}
          hasMore={hasMore}
          useWindow={false}
          getScrollParent={() => scrollParentRef!.current}
        >
          <div className="grid grid-cols-2 md:grid-cols-3">
            {nfts?.map(nft => {
              return <NFTItem key={nft.transactionId} nft={nft} />;
            })}
          </div>
        </InfiniteScroll>
      </>
    );
  }
);

export default NFTView;
