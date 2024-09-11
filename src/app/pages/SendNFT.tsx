import React, { FC, useState } from 'react';

import PageLayout from 'app/layouts/PageLayout';
import Confirmation from 'app/templates/Confirmation';
import ConfirmNFTForm from 'app/templates/ConfirmNFTForm';
import SendNFTForm from 'app/templates/SendNFTForm';
import { SendNFTFormSelectors } from 'app/templates/SendNFTForm.selectors';
import { ConfirmStatus } from 'lib/miden/front/send-types';
import { t } from 'lib/i18n/react';
import { useLocation } from 'lib/woozie';

interface SendNFTInfo {
  to: string;
  fee: bigint;
  feePrivate: boolean;
}

const SendNFT: FC<{}> = () => {
  const location = useLocation();
  const nft = location.state;

  const [sendInfo, setSendInfo] = useState<SendNFTInfo | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>({ confirmed: false, delegated: false });
  const confirmed = confirmStatus.confirmed;

  let pageTitle = `${t('send')} ${t('nft')}`.toUpperCase();
  if (sendInfo) {
    pageTitle = t('reviewAndConfirm');
  }
  if (confirmed) {
    pageTitle = '';
  }

  return (
    <PageLayout pageTitle={pageTitle} hasBackAction={!confirmed} hideToolbar={confirmed}>
      <div className="p-4">
        <div className="w-full max-w-sm mx-auto">
          {!sendInfo && (
            <SendNFTForm
              nft={nft}
              setSendInfo={(to: string, fee: bigint, feePrivate: boolean) => setSendInfo({ to, fee, feePrivate })}
            />
          )}
          {sendInfo && !confirmed && (
            <ConfirmNFTForm
              nft={nft}
              to={sendInfo.to}
              fee={sendInfo.fee}
              feePrivate={sendInfo.feePrivate}
              setConfirmStatus={(delegated: boolean) => setConfirmStatus({ confirmed: true, delegated })}
            />
          )}
          {confirmed && (
            <Confirmation delegated={confirmStatus.delegated} testId={SendNFTFormSelectors.InitiatedHomeButton} />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default SendNFT;
