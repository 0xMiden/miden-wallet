import React, { FC, Suspense, useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';

import Spinner from 'app/atoms/Spinner/Spinner';
import { RECOMMENDED_FEES } from 'app/constants';
import { ReactComponent as PublicGlobeIcon } from 'app/icons/globe.svg';
import { ReactComponent as PrivateLockIcon } from 'app/icons/lock.svg';
import { ALEO_DECIMALS } from 'lib/fiat-curency/consts';
import { formatBigInt } from 'lib/i18n/numbers';
import { t } from 'lib/i18n/react';
import { ALEO_SLUG, ALEO_TOKEN_ID } from 'lib/miden/assets/constants';
import { useAccount, useBalance } from 'lib/miden/front';

import CustomizeFee from './CustomizeFee';
import { INFT } from './NFTs/INFT';

type ConvertNFTFormProps = {
  nft: INFT;
  feePrivate: boolean;
  setConvertFee: (fee: bigint) => void;
  setFeePrivate: (feePrivate: boolean) => void;
};

const ConvertNFTView: FC<ConvertNFTFormProps> = ({ nft, feePrivate, setConvertFee, setFeePrivate }) => {
  const account = useAccount();

  useEffect(() => {
    // if (privateFetching || publicFetching || !privateBalance || !publicBalance) {
    //   return;
    // }
    // if (privateBalance.isEqualTo(new BigNumber(0)) && publicBalance.isGreaterThan(new BigNumber(0))) {
    //   setFeePrivate(false);
    // }
  }, [setFeePrivate]);

  const [fee, setFee] = useState<bigint>(RECOMMENDED_FEES.CONVERT_NFT);
  const [editingFee, setEditingFee] = useState(false);
  const assetSymbol = 'ALEO';

  const publicNFTSection = (
    <div className="flex items-center">
      <PublicGlobeIcon fill="#656565" height="16px" width="16px" />
      <div className="ml-1 text-base" style={{ color: '#656565' }}>{`${t('public')} ${t('nft')}`}</div>
    </div>
  );
  const privateNFTSection = (
    <div className="flex items-center">
      <PrivateLockIcon fill="#656565" height="16px" width="16px" />
      <div className="ml-1 text-base" style={{ color: '#656565' }}>{`${t('private')} ${t('nft')}`}</div>
    </div>
  );

  return (
    <>
      <Suspense fallback={<SpinnerSection />}>
        {!editingFee && (
          <div className="flex flex-col">
            <div className="flex justify-start items-center">
              <img
                crossOrigin="anonymous"
                className="object-contain rounded-lg border-2 border-opacity-90"
                src={nft.imageURI}
                alt={nft.symbol}
                style={{ height: '84px' }}
              />
              <div className="flex flex-col justify-start pl-4">
                <div className="flex flex-row justify-between">
                  {nft.isPrivate ? privateNFTSection : publicNFTSection}
                </div>
                <span className="text-left text-base font-medium text-black" style={{ lineHeight: '24px' }}>
                  {nft.collectionName || nft.symbol} {nft.mintNumber && `#${nft.mintNumber}`}
                </span>
              </div>
            </div>
            <div className="flex mt-8">
              <div className="flex flex-col justify-start mr-auto">
                <div className="text-base text-black font-medium">{t('from')}</div>
                {nft.isPrivate ? privateNFTSection : publicNFTSection}
              </div>
              <div className="flex flex-col justify-start mr-auto">
                <div className="text-base text-black font-medium">{t('to')}</div>
                {nft.isPrivate ? publicNFTSection : privateNFTSection}
              </div>
            </div>
            <div className="flex flex-col justify-start mt-8">
              <div className="text-base text-black font-medium">{t('fee')}</div>
              <span className="text-base mt-1" style={{ color: '#656565' }}>{`${formatBigInt(
                fee,
                ALEO_DECIMALS
              )} ${assetSymbol}`}</span>
              <div
                className="cursor-pointer text-base mt-1"
                style={{ color: '#3872D4' }}
                onClick={() => setEditingFee(true)}
              >
                {t('customizeFee')}
              </div>
              <button
                className="px-8 rounded-lg bg-primary-500 items-center text-white text-sm font-semibold transition duration-200 ease-in-out hover:opacity-90 focus:opacity-90 hover:bg-gradient-to-r hover:from-#472AA0 hover:from-0% hover:to-10% capitalize w-full justify-center mt-32"
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  padding: '14px 0px'
                }}
                onClick={() => setConvertFee(fee)}
              >
                {`${t('convert')} ${t('nft')}`}
              </button>
            </div>
          </div>
        )}
        {editingFee && (
          <CustomizeFee
            fee={fee}
            feePrivate={feePrivate}
            recommendedFee={RECOMMENDED_FEES.CONVERT_NFT}
            allowOneCreditRecord={true}
            setFee={(amount: bigint) => {
              setFee(amount);
              setEditingFee(false);
            }}
            setFeePrivate={setFeePrivate}
            cancel={() => setEditingFee(false)}
          />
        )}
      </Suspense>
    </>
  );
};

export default ConvertNFTView;

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-8">
    <Spinner />
  </div>
);
