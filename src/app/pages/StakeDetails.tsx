import React, { FC } from 'react';

import BigNumber from 'bignumber.js';

import { PrimaryButton, SecondaryButton } from 'app/atoms/ActionButtons';
import HashShortView from 'app/atoms/HashShortView';
import { useAppEnv } from 'app/env';
import PageLayout from 'app/layouts/PageLayout';
import PreviewTransactionAmount from 'app/templates/PreviewTransactionAmount';
import Validator from 'app/templates/Staking/Validator';
import { t } from 'lib/i18n/react';
import { ALEO_SLUG, ALEO_TOKEN_ID } from 'lib/miden/assets/constants';
import { useAccount, useStakedBalance, useUnstakedBalance } from 'lib/miden/front';
import { Link } from 'lib/woozie';

export interface StakeDetailsProps {
  assetSlug?: string;
  assetId?: string;
}

const StakeDetails: FC<StakeDetailsProps> = ({ assetSlug = ALEO_SLUG, assetId = ALEO_TOKEN_ID }) => {
  const account = useAccount();

  const { fullPage } = useAppEnv();
  const balance = new BigNumber(12345);
  const rewards = new BigNumber(12);

  return (
    <PageLayout pageTitle={`${t('yourStakeIn')} Aleo Validator`}>
      <div className="p-4">
        <div className="w-full max-w-sm mx-auto">
          <PreviewTransactionAmount amount={balance!} assetSymbol={assetSlug?.toUpperCase() || 'ALEO'} />
          <div className="pb-4">
            <div className="flex flex-row justify-between text-sm my-1">
              <span className="text-gray-200">{t('rewards')}</span>
              <span className="font-medium text-green-500">
                +{rewards!.toNumber()} {assetSlug?.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-row justify-between text-sm my-1">
              <span className="text-gray-200">{t('stakeAccount')}</span>
              <span className="text-black">
                {`${account.name} (`}
                <HashShortView hash={account.publicKey} />
                {`)`}
              </span>
            </div>
          </div>
          <Validator />
          {/* buttons */}
          <div
            className={`flex flex-col justify-end w-full bottom-0 left-0 px-4 mb-6 ${fullPage ? 'absolute' : 'fixed'}`}
          >
            <div className="flex flex-row justify-between w-full max-w-sm mx-auto">
              <Link to="/unstake" style={{ width: '48%' }}>
                <SecondaryButton>
                  {t('unstake')} {assetSlug?.toUpperCase()}
                </SecondaryButton>
              </Link>
              <Link to="/stake" style={{ width: '48%' }}>
                <PrimaryButton>
                  {t('stake')} {assetSlug?.toUpperCase()}
                </PrimaryButton>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default StakeDetails;
