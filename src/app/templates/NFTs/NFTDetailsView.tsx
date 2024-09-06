import React, { FC } from 'react';

import { useAppEnv } from 'app/env';
import { ReactComponent as PublicGlobeIcon } from 'app/icons/globe.svg';
import { ReactComponent as PrivateLockIcon } from 'app/icons/lock.svg';

import { T, t } from 'lib/i18n/react';
import { Link } from 'lib/woozie';

import { INFT } from './INFT';

type NFTDetailsViewProps = {
  nft: INFT;
};

const NFTDetailsView: FC<NFTDetailsViewProps> = ({ nft }) => {
  const { fullPage } = useAppEnv();
  const divStyle = fullPage ? {} : { maxHeight: '410px' };
  const buttonClassName = fullPage ? 'flex pb-4 px-4' : 'w-full p-4 fixed bottom-0';

  return (
    <>
      <div className="flex flex-col m-4 justify-center items-center text-sm">
        <div className="flex flex-col" style={divStyle}>
          <img
            crossOrigin="anonymous"
            className="object-contain rounded-lg border-2 border-opacity-90"
            src={nft.imageURI}
            alt={nft.symbol}
          />
          <span className="text-left text-lg font-semibold text-black pt-3">
            {nft.collectionName || nft.symbol} {nft.mintNumber && `#${nft.mintNumber}`}
          </span>

          {nft.collectionDescription && (
            <span className="text-left text-sm text-black pt-2">{nft.collectionDescription}</span>
          )}

          <div className="w-full flex justify-between pt-3 text-gray-200">
            <T id="visibility" />
            {nft.isPrivate ? (
              <div className="flex items-center">
                <PrivateLockIcon fill="black" height="16px" width="16px" />
                <div className="ml-1 text-black">{`${t('private')} ${t('nft')}`}</div>
              </div>
            ) : (
              <div className="flex items-center">
                <PublicGlobeIcon fill="black" height="16px" width="16px" />
                <div className="ml-1 text-black">{`${t('public')} ${t('nft')}`}</div>
              </div>
            )}
          </div>

          <span className="pt-3 font-medium">
            <T id="attributes" />
          </span>
          {nft.attributes?.map((attribute, index) => {
            return (
              <div key={index} className="w-full flex justify-between pt-1 text-gray-200">
                <span>{attribute.trait_type}</span>
                <span>{attribute.value}</span>
              </div>
            );
          })}
          {!nft.attributes && (
            <span className="pt-2 text-gray-500">
              <T id="none" />
            </span>
          )}

          <div className="w-full flex justify-between pt-3 text-gray-200">
            <span>NFT ID</span>
            <span>{nft.tokenId}</span>
          </div>

          {nft.collectionLink && (
            <div className="w-full flex justify-between pt-3 text-gray-200">
              <span>
                <T id="collection" />
              </span>
              <a
                className="text-primary-purple transition duration-200 ease-in-out opacity-75 hover:opacity-100 focus:opacity-100 hover:underline"
                href={nft.collectionLink}
              >
                {nft.collectionName || <T id="collection" />}
              </a>
            </div>
          )}

          {nft.sourceLink && (
            <div className="w-full flex justify-between pt-3 text-gray-200">
              <span>
                <T id="source" />
              </span>
              <a
                className="text-primary-purple transition duration-200 ease-in-out opacity-75 hover:opacity-100 focus:opacity-100 hover:underline"
                href={nft.sourceLink}
              >
                <T id="sourceLink" />
              </a>
            </div>
          )}

          <div className="w-full flex justify-between pt-3 text-gray-200">
            <span>
              <T id="explorer" />
            </span>
            <a
              className="text-primary-purple transition duration-200 ease-in-out opacity-75 hover:opacity-100 focus:opacity-100 hover:underline"
              href={'leo.app'}
            >
              <T id="explorerLink" />
            </a>
          </div>
        </div>
      </div>
      <Link to={{ pathname: '/send-nft', state: nft }} className={buttonClassName}>
        <button
          className="px-8 rounded-lg bg-primary-500 items-center text-white text-sm font-semibold transition duration-200 ease-in-out hover:opacity-90 focus:opacity-90 hover:bg-gradient-to-r hover:from-#472AA0 hover:from-0% hover:to-10% capitalize w-full justify-center mt-6"
          style={{
            fontSize: '16px',
            lineHeight: '24px',
            padding: '14px 0px'
          }}
        >
          <T id="send" />
        </button>
      </Link>
    </>
  );
};

export default NFTDetailsView;
