import React, { memo, FC, ReactNode, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import { useAppEnv } from 'app/env';
import { ReactComponent as DollarIcon } from 'app/icons/dollar.svg';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { ALEO_TOKEN_ID } from 'lib/miden/assets/constants';
import { getAssetName, useAssetMetadata, useDisplayedFungibleTokens, useBalance, useAccount } from 'lib/miden/front';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-curency';
import { T } from 'lib/i18n/react';
import { PropsWithChildren } from 'lib/props-with-children';

type MainBannerProps = {
  balance: BigNumber;
};

const MainBanner = memo<MainBannerProps>(({}) => {
  return <AssetBanner />;
});

export default MainBanner;

type AleoVolumeBannerProps = {
  balance: BigNumber;
};

const AleoVolumeBanner: FC<AleoVolumeBannerProps> = ({ balance }) => {
  // TODO: This just returns 1 for now
  const tokenPrice = useAssetFiatCurrencyPrice('miden');

  const volumeInUSD = useMemo(() => {
    if (balance && tokenPrice) {
      const balanceInUsd = balance.times(tokenPrice);

      return balanceInUsd;
    }

    return null;
  }, [balance, tokenPrice]);

  return (
    <BannerLayout name={<T id="totalBalance" />}>
      <div className="h-12 w-full flex items-stretch justify-start">
        {volumeInUSD && (
          <>
            <div className="flex-1 flex items-center justify-end">
              <DollarIcon
                className={classNames('flex-shrink-0', 'h-10 w-auto -mr-2', 'stroke-current text-gray-500')}
              />
            </div>

            <h3 className="text-3xl  text-black flex items-center">
              <Money fiat>{volumeInUSD}</Money>
            </h3>

            <div className="flex-1" />
          </>
        )}
      </div>
    </BannerLayout>
  );
};

type AssetBannerProps = {
  // assetSlug?: string | null;
  // assetId?: string | null;
  // accountPk: string;
};

const BalanceBanner: FC<{ balance: BigNumber; assetSlug?: string | null }> = ({ balance, assetSlug }) => {
  if (assetSlug) {
    return (
      <div className="mt-3 font-bold text-black flex" style={{ fontSize: `2.25rem`, lineHeight: '2.5rem' }}>
        {balance.toString()}
        <div className="flex flex-col justify-end ml-2" style={{ fontSize: `22px`, lineHeight: '32px' }}>
          <span className="text-gray-4 font-normal uppercase" style={{ color: '#9E9E9E' }}>
            {assetSlug}
          </span>
        </div>
      </div>
    );
  }
  return (
    <InFiat assetSlug={assetSlug || 'aleo'} volume={balance} smallFractionFont={false}>
      {({ balance, symbol }) => (
        <div className="mt-1 font-bold text-black flex" style={{ fontSize: `2.25rem`, lineHeight: '2.5rem' }}>
          <span>{symbol}</span>
          {balance}
        </div>
      )}
    </InFiat>
  );
};

const AssetBanner: FC<AssetBannerProps> = ({}) => {
  const { popup } = useAppEnv();

  return (
    <BannerLayout name={<Name style={{ maxWidth: popup ? '11rem' : '13rem' }}>{'Miden'}</Name>}>
      <div className=" w-full flex justify-center">
        <div className="flex items-center">
          <Balance>{balance => <BalanceBanner balance={balance} />}</Balance>
        </div>
      </div>
    </BannerLayout>
  );
};

interface BannerLayoutProps extends PropsWithChildren {
  name: ReactNode;
}

const BannerLayout: FC<BannerLayoutProps> = ({ name, children }) => (
  <div className={classNames('w-full', 'flex flex-col justify-start max-w-sm px-3')}>
    <div className={classNames('relative', 'w-full', 'pb-3', 'flex')}>{children}</div>
  </div>
);
