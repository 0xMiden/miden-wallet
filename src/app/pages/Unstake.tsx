import React, { FC, useCallback, useState } from 'react';

import { RECOMMENDED_FEES } from 'app/constants';
import PageLayout from 'app/layouts/PageLayout';
import Confirmation from 'app/templates/Confirmation';
import InformationBanner from 'app/templates/InformationBanner';
import { StakeFormSelectors } from 'app/templates/StakeForm.selectors';
import ConfirmStakeForm from 'app/templates/Staking/ConfirmStake';
import StakeForm from 'app/templates/Staking/StakeForm';
import { ALEO_SLUG, ALEO_TOKEN_ID } from 'lib/miden/assets/constants';
import { useAccount, useStakedBalance } from 'lib/miden/front';
import { ConfirmStatus } from 'lib/miden/front/send-types';
import { t } from 'lib/i18n/react';
import BigNumber from 'bignumber.js';

interface UnstakeInfo {
  amount: bigint;
  fee: bigint;
  feePrivate: boolean;
}

type UnstakeProps = {
  assetSlug?: string;
  assetId?: string;
};

const Unstake: FC<UnstakeProps> = ({ assetSlug = ALEO_SLUG, assetId = ALEO_TOKEN_ID }) => {
  const account = useAccount();
  const [stakeInfo, setStakeInfo] = useState<UnstakeInfo | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>({ confirmed: false, delegated: false });

  const confirmed = confirmStatus.confirmed;

  let pageTitle = `${t('unstake')} ${assetSlug.toUpperCase()}`;
  if (stakeInfo) {
    pageTitle = `${t('unstake')} ${t('preview')}`;
  }
  if (confirmed) {
    pageTitle = '';
  }

  return (
    <PageLayout pageTitle={pageTitle} hasBackAction={!confirmed} hideToolbar={confirmed}>
      <div className="p-4">
        <div className="w-full max-w-sm mx-auto">
          {!stakeInfo && (
            <>
              <StakeForm
                assetSlug={assetSlug}
                balance={new BigNumber(0)}
                balanceIsLoading={false}
                recommendedFee={RECOMMENDED_FEES.UNSTAKE}
                setStakeInfo={(amount: bigint, fee: bigint, feePrivate: boolean) =>
                  setStakeInfo({ amount, fee, feePrivate })
                }
              >
                <InformationBanner title={t('pleaseNote')} bodyText={t('unstakingProcess')} />
              </StakeForm>
            </>
          )}
          {stakeInfo && !confirmed && (
            <ConfirmStakeForm
              action={'unstake'}
              amount={stakeInfo.amount}
              fee={stakeInfo.fee}
              feePrivate={stakeInfo.feePrivate}
              validator={''}
              setConfirmStatus={(delegated: boolean) => setConfirmStatus({ confirmed: true, delegated })}
              initiateTransaction={() => {}}
            />
          )}
          {confirmed && (
            <Confirmation delegated={confirmStatus.delegated} testId={StakeFormSelectors.InitiatedHomeButton} />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Unstake;
