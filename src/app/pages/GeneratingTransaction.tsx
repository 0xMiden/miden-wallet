/* eslint-disable @typescript-eslint/no-unused-expressions */

import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'clsx';

import CircularProgress from 'app/atoms/CircularProgress';
import { closeLoadingFullPage } from 'app/env';
import useBeforeUnload from 'app/hooks/useBeforeUnload';
import { ReactComponent as WarningIcon } from 'app/icons/warning-alt.svg';
import PageLayout from 'app/layouts/PageLayout';
import { isAutoCloseEnabled } from 'app/templates/AutoCloseSettings';
import { useAnalytics } from 'lib/analytics';
import { t, T } from 'lib/i18n/react';
import { consumeNoteId } from 'lib/miden-worker/consumeNoteId';
import { sendTransaction } from 'lib/miden-worker/sendTransaction';
import { ITransactionStatus } from 'lib/miden/db/transaction-types';
import { putToStorage } from 'lib/miden/front';
import { safeGenerateTransactionsLoop, useQueuedTransactions } from 'lib/miden/front/queued-transactions';
import { Alert, AlertVariant } from 'components/Alert';

const GeneratingTransaction: FC = () => {
  const [displayMessage, setDisplayMessage] = useState('');
  const { pageEvent, trackEvent, performanceEvent } = useAnalytics();
  // const { allContacts } = useFilteredContacts();
  // const { authorizeDeploy } = useMidenContext();
  const [transactions] = useQueuedTransactions();

  useEffect(() => {
    pageEvent('GeneratingTransaction', '');
  }, [pageEvent]);

  const prevTransactionsLength = useRef<number>();
  useEffect(() => {
    if (transactions.length > 0) {
      // TODO
    } else if (prevTransactionsLength.current && prevTransactionsLength.current > 0 && transactions.length === 0) {
      setDisplayMessage(t('noTransactionsRemaining'));
      new Promise(res => setTimeout(res, 10_000)).then(async () => {
        await trackEvent('GeneratingTransaction Page Closed Automatically');
        isAutoCloseEnabled() && closeLoadingFullPage();
      });
    }

    prevTransactionsLength.current = transactions.length;
  }, [transactions, trackEvent]);

  useEffect(() => {
    safeGenerateTransactionsLoop(consumeNoteId, sendTransaction);
    setInterval(() => {
      safeGenerateTransactionsLoop(consumeNoteId, sendTransaction);
    }, 5_000);
  }, [transactions]);

  const clearStorage = useCallback(() => {
    putToStorage('miden-queued-transactions', []);
  }, []);

  useBeforeUnload(t('generatingTransactionWarning'), transactions.length !== 0, clearStorage);
  const progress = transactions.length > 0 ? (1 / transactions.length) * 80 : 0;

  return (
    <PageLayout
      pageTitle={
        <div className="font-semibold" style={{ fontSize: '18px', lineHeight: '24px' }}>
          <T id="generatingTransaction" />
        </div>
      }
      hasBackAction={false}
    >
      <div>
        <div className={classNames('w-full max-w-sm mx-auto')}>
          <Alert
            variant={AlertVariant.Warning}
            title="Do not close this window. Window will auto-close after the transaction is generated"
          />
          <div className="flex-1 flex flex-col justify-center items-center md:w-[460px] md:mx-auto mt-6">
            <div
              className={classNames(
                'w-40 aspect-square flex items-center justify-center',
                'rounded-full bg-gradient-to-t from-white to-[#F9F9F9]'
              )}
            >
              <CircularProgress borderWeight={6} progress={progress} circleColor="black" circleSize={50} spin={true} />
            </div>
            <div
              className="flex flex-col pt-6 items-center text-black font-medium text-center"
              style={{ fontSize: '18px', lineHeight: '24px' }}
            >
              {displayMessage}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default GeneratingTransaction;
