import React, { FC, useState } from 'react';

import BigNumber from 'bignumber.js';

import { RECOMMENDED_FEES } from 'app/constants';
import PageLayout from 'app/layouts/PageLayout';
import Confirmation from 'app/templates/Confirmation';
import CustomizeFee from 'app/templates/CustomizeFee';
import PreviewTransactionAmount from 'app/templates/PreviewTransactionAmount';
import { StakeFormSelectors } from 'app/templates/StakeForm.selectors';
import { t } from 'lib/i18n/react';
import { ConfirmStatus } from 'lib/miden/front/send-types';
import { HistoryAction, navigate } from 'lib/woozie';

interface ClaimUnstakedProps {
  assetSlug?: string;
  assetId?: string;
}

const ClaimUnstaked: FC<ClaimUnstakedProps> = ({ assetSlug = '', assetId = '' }) => {
  const [confirmStatus] = useState<ConfirmStatus>({ confirmed: false, delegated: false });
  const confirmed = confirmStatus.confirmed;
  const [feePrivate, setFeePrivate] = useState<boolean>(true);

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
