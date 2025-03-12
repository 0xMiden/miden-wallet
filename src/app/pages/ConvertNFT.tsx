import React, { FC, useState } from 'react';

import PageLayout from 'app/layouts/PageLayout';
import Confirmation from 'app/templates/Confirmation';
import ConfirmConvertNFTForm from 'app/templates/ConfirmConvertNFTForm';
import ConvertNFTForm from 'app/templates/ConvertNFTForm';
import { ConvertNFTVisibilityFormSelectors } from 'app/templates/ConvertNFTForm.selectors';
import { t } from 'lib/i18n/react';
import { ConfirmStatus } from 'lib/miden/front/send-types';
import { useLocation } from 'lib/woozie';

const ConvertNFT: FC<{}> = () => {
  const location = useLocation();
  const nft = location.state;

  const [fee, setConvertFee] = useState<bigint | null>(null);
  const [feePrivate, setFeePrivate] = useState<boolean>(true);
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>({ confirmed: false, delegated: false });
  const confirmed = confirmStatus.confirmed;

  let pageTitle = `${t('convert')} ${t('nft')}`.toUpperCase();
  if (fee) {
    pageTitle = t('reviewAndConfirm');
  }
  if (confirmed) {
    pageTitle = '';
  }

  return (
    <PageLayout pageTitle={pageTitle} hasBackAction={!confirmed} hideToolbar={confirmed}>
      <div className="p-4">
        <div className="w-full max-w-sm mx-auto">
          {fee == null && (
            <ConvertNFTForm
              nft={nft}
              feePrivate={feePrivate}
              setConvertFee={(fee: bigint) => setConvertFee(fee)}
              setFeePrivate={setFeePrivate}
            />
          )}
          {fee !== null && !confirmed && (
            <ConfirmConvertNFTForm
              nft={nft}
              fee={fee}
              feePrivate={feePrivate}
              setConfirmStatus={(delegated: boolean) => setConfirmStatus({ confirmed: true, delegated })}
            />
          )}
          {confirmed && (
            <Confirmation
              delegated={confirmStatus.delegated}
              testId={ConvertNFTVisibilityFormSelectors.InitiatedHomeButton}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ConvertNFT;
