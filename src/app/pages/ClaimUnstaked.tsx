import React, { FC, useCallback, useState } from 'react';

import { RECOMMENDED_FEES } from 'app/constants';
import { openLoadingFullPage } from 'app/env';
import PageLayout from 'app/layouts/PageLayout';
import Confirmation from 'app/templates/Confirmation';
import CustomizeFee from 'app/templates/CustomizeFee';
import { isDelegateProofEnabled } from 'app/templates/DelegateSettings';
import PreviewTransactionAmount from 'app/templates/PreviewTransactionAmount';
import { StakeFormSelectors } from 'app/templates/StakeForm.selectors';
import { ALEO_SLUG, ALEO_TOKEN_ID, CREDITS_PROGRAM_ID } from 'lib/miden/assets/constants';
import { useAccount, useMidenContext, useUnstakedBalance } from 'lib/miden/front';
import { ConfirmStatus } from 'lib/miden/front/send-types';
import { ALEO_MICROCREDITS_TO_CREDITS } from 'lib/fiat-curency';
import { t } from 'lib/i18n/react';
import { HistoryAction, navigate } from 'lib/woozie';
import BigNumber from 'bignumber.js';

interface ClaimUnstakedProps {
  assetSlug?: string;
  assetId?: string;
}

const ClaimUnstaked: FC<ClaimUnstakedProps> = ({ assetSlug = ALEO_SLUG, assetId = ALEO_TOKEN_ID }) => {
  const account = useAccount();
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>({ confirmed: false, delegated: false });
  const confirmed = confirmStatus.confirmed;
  const [feePrivate, setFeePrivate] = useState<boolean>(true);
  const delegateTransaction = isDelegateProofEnabled();
  const { authorizeTransaction } = useMidenContext();

  let pageTitle = `${t('claim')} ${assetSlug.toUpperCase()}`;

  if (confirmed) {
    pageTitle = '';
  }

  return (
    <PageLayout pageTitle={pageTitle}>
      <div className="p-4">
        <div className="w-full max-w-sm mx-auto">
          {!confirmed && (
            <>
              <PreviewTransactionAmount amount={new BigNumber(12345)} assetSymbol={assetSlug!.toUpperCase()} />
              <CustomizeFee
                fee={RECOMMENDED_FEES.CLAIM_UNSTAKED}
                feePrivate={feePrivate}
                recommendedFee={RECOMMENDED_FEES.CLAIM_UNSTAKED}
                allowOneCreditRecord={false}
                setFee={(amount: bigint) => {}}
                setFeePrivate={(privateFee: boolean) => {
                  setFeePrivate(privateFee);
                }}
                cancel={() => navigate('/stake-details', HistoryAction.Replace)}
                submitAction={t('claim')}
              />
            </>
          )}
          {confirmed && <Confirmation delegated={confirmStatus.delegated} testId={StakeFormSelectors.ClaimUnstaked} />}
        </div>
      </div>
    </PageLayout>
  );
};

export default ClaimUnstaked;
