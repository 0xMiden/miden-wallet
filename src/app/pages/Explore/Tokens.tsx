import React, { FC } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import useMidenFaucetId from 'app/hooks/useMidenFaucetId';
import { Avatar } from 'components/Avatar';
import { CardItem } from 'components/CardItem';
import { useAccount, useAllTokensBaseMetadata, useAllBalances } from 'lib/miden/front';
import { navigate } from 'lib/woozie';
import { truncateAddress } from 'utils/string';

const Tokens: FC = () => {
  const midenFaucetId = useMidenFaucetId();
  const account = useAccount();
  const { t } = useTranslation();
  const allTokensBaseMetadata = useAllTokensBaseMetadata();
  const { data: allTokenBalances = [] } = useAllBalances(account.publicKey, allTokensBaseMetadata);

  return (
    <>
      <div className={classNames('w-full pt-3 mb-2', 'flex justify-start', 'text-sm font-semibold text-black')}>
        {allTokenBalances.length > 0 && <span>{t('tokens')}</span>}
      </div>
      <div className="flex-1 flex flex-col pb-4 gap-2">
        {allTokenBalances.length > 0 &&
          allTokenBalances
            .sort(a => (a.tokenId === midenFaucetId ? -1 : 1))
            .map(asset => {
              const isMiden = asset.tokenId === midenFaucetId;
              const balance = asset.balance;
              const { tokenId, metadata } = asset;
              return (
                <div key={tokenId} className="relative flex">
                  <CardItem
                    iconLeft={
                      <Avatar size="lg" image={isMiden ? '/misc/miden.png' : '/misc/token-logos/default.svg'} />
                    }
                    title={metadata.symbol}
                    subtitle={truncateAddress(tokenId, false)}
                    titleRight={`$${balance.toFixed(2)}`}
                    subtitleRight={balance.toFixed(2)}
                    className="flex-1 border border-grey-50 rounded-lg"
                    hoverable={true}
                    onClick={() => navigate(`/token-history/${tokenId}`)}
                  />
                </div>
              );
            })}
      </div>
    </>
  );
};

export default Tokens;
