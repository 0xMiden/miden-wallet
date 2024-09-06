import React, { FC } from 'react';

import { ReactComponent as PublicGlobeIcon } from 'app/icons/globe.svg';
import { t } from 'lib/i18n/react';
import useTippy from 'lib/ui/useTippy';
import { Link } from 'lib/woozie';

import { INFT } from './INFT';

type NFTItemProps = {
  nft: INFT;
};

const publicIconStyles: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 10,
  width: 24,
  height: 24,
  borderRadius: 4,
  background: '#00000080',
  padding: 4
};
const NFTItem: FC<NFTItemProps> = ({ nft }) => {
  const feeRef = useTippy<HTMLDivElement>(feeTippyPropsMock);
  return (
    <div className="flex flex-col justify-center mt-2 items-center">
      <div className="flex flex-col">
        <div className="relative">
          <Link to={{ pathname: '/nfts/details', state: nft }}>
            <img
              crossOrigin="anonymous"
              className="h-40 w-40 object-contain rounded-lg border-2 border-opacity-90"
              src={nft.imageURI}
              alt={nft.symbol}
            />
          </Link>
          {!nft.isPrivate && (
            <div ref={feeRef} style={publicIconStyles}>
              <PublicGlobeIcon
                fill="white"
                style={{
                  cursor: 'pointer'
                }}
              />
            </div>
          )}
        </div>

        <span className="text-left w-40 text-sm overflow-hidden truncate py-3">
          {nft.collectionName || nft.symbol} {nft.mintNumber && `#${nft.mintNumber}`}
        </span>
      </div>
    </div>
  );
};

const feeTippyPropsMock = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('public') + ' NFT',
  animation: 'shift-away-subtle'
};

export default NFTItem;
