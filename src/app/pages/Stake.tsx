import React, { FC, useCallback, useState } from 'react';

import BigNumber from 'bignumber.js';

import { RECOMMENDED_FEES } from 'app/constants';
import PageLayout from 'app/layouts/PageLayout';
import Confirmation from 'app/templates/Confirmation';
import { StakeFormSelectors } from 'app/templates/StakeForm.selectors';
import ConfirmStakeForm from 'app/templates/Staking/ConfirmStake';
import StakeForm from 'app/templates/Staking/StakeForm';
import Validator from 'app/templates/Staking/Validator';
import { t } from 'lib/i18n/react';
import { ALEO_SLUG, ALEO_TOKEN_ID } from 'lib/miden/assets/constants';
import { useAccount, useBalance, useStakedBalance } from 'lib/miden/front';
import { ConfirmStatus } from 'lib/miden/front/send-types';

const VALIDATOR_KEY = 'aleo1q6qstg8q8shwqf5m6q5fcenuwsdqsvp4hhsgfnx5chzjm3secyzqt9mxm8';
interface StakeInfo {
  amount: bigint;
  validator?: string;
  fee: bigint;
  feePrivate: boolean;
}

type StakeProps = {
  assetSlug?: string;
  assetId?: string;
};

const Stake: FC<StakeProps> = ({ assetSlug = ALEO_SLUG, assetId = ALEO_TOKEN_ID }) => {
  const account = useAccount();

  const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>({ confirmed: false, delegated: false });

  const confirmed = confirmStatus.confirmed;
  const defaultValidator = VALIDATOR_KEY;

  let pageTitle = `${t('stake')} ${assetSlug.toUpperCase()}`;
  if (stakeInfo) {
    pageTitle = `${t('stake')} ${t('preview')}`;
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
                recommendedFee={RECOMMENDED_FEES.STAKE}
                isFirstStakingTransaction={false}
                setStakeInfo={(amount: bigint, fee: bigint, feePrivate: boolean, validator?: string) =>
                  setStakeInfo({ amount, fee, feePrivate, validator })
                }
              >
                <span className="font-medium text-sm text-black py-2">{t('validator')}</span>
                <Validator />
              </StakeForm>
            </>
          )}
          {stakeInfo && !confirmed && (
            <ConfirmStakeForm
              action={'stake'}
              amount={stakeInfo.amount}
              fee={stakeInfo.fee}
              feePrivate={stakeInfo.feePrivate}
              validator={stakeInfo.validator ?? defaultValidator}
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

export default Stake;
