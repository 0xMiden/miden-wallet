/* eslint-disable @typescript-eslint/no-unused-expressions */

import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import CircularProgress from 'app/atoms/CircularProgress';
import { closeLoadingFullPage } from 'app/env';
import useBeforeUnload from 'app/hooks/useBeforeUnload';
import { Icon, IconName } from 'app/icons/v2';
import { isAutoCloseEnabled } from 'app/templates/AutoCloseSettings';
import { Alert, AlertVariant } from 'components/Alert';
import { Button, ButtonVariant } from 'components/Button';
import { useAnalytics } from 'lib/analytics';
import { t } from 'lib/i18n/react';
import { safeGenerateTransactionsLoop as dbTransactionsLoop, getAllUncompletedTransactions } from 'lib/miden/activity';
import { useExportNotes } from 'lib/miden/activity/notes';
import { useRetryableSWR } from 'lib/swr';
import { navigate } from 'lib/woozie';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import { NoteExportType } from 'lib/miden/sdk/constants';

export interface GeneratingTransactionPageProps {
  keepOpen?: boolean;
}

export const GeneratingTransactionPage: FC<GeneratingTransactionPageProps> = ({ keepOpen = true }) => {
  const { pageEvent, trackEvent } = useAnalytics();
  const [outputNotes, downloadAll] = useExportNotes();

  const { data: txs, mutate: mutateTx } = useRetryableSWR(
    [`all-latest-generating-transactions`],
    async () => getAllUncompletedTransactions(),
    {
      revalidateOnMount: true,
      refreshInterval: 5_000,
      dedupingInterval: 3_000
    }
  );

  const onClose = useCallback(() => {
    if (keepOpen) {
      navigate('/');
      return;
    }

    closeLoadingFullPage();
  }, [keepOpen]);

  useEffect(() => {
    pageEvent('GeneratingTransaction', '');
  }, [pageEvent]);

  const transactions = useMemo(() => txs || [], [txs]);
  const prevTransactionsLength = useRef<number>();
  useEffect(() => {
    if (
      outputNotes.length === 0 &&
      prevTransactionsLength.current &&
      prevTransactionsLength.current > 0 &&
      transactions.length === 0
    ) {
      new Promise(res => setTimeout(res, 10_000)).then(async () => {
        await trackEvent('GeneratingTransaction Page Closed Automatically');
        isAutoCloseEnabled() && onClose();
      });
    }

    prevTransactionsLength.current = transactions.length;
  }, [transactions, trackEvent, outputNotes, onClose]);

  useEffect(() => {
    dbTransactionsLoop();
    setInterval(() => {
      dbTransactionsLoop();
      mutateTx();
    }, 5_000);
  }, [transactions, mutateTx]);

  useBeforeUnload(t('generatingTransactionWarning'), transactions.length !== 0, downloadAll);
  const progress = transactions.length > 0 ? (1 / transactions.length) * 80 : 0;

  return (
    <div
      className={classNames(
        'h-[640px] max-h-[640px] w-[600px] max-w-[600px]',
        'mx-auto overflow-hidden ',
        'flex flex-1',
        'flex-col bg-white p-6',
        'border rounded-3xl',
        'overflow-hidden relative'
      )}
    >
      <div className={classNames('flex flex-1 flex-col w-full')}>
        <GeneratingTransaction
          progress={progress}
          onDoneClick={onClose}
          transactionComplete={transactions.length === 0}
        />
      </div>
    </div>
  );
};

export interface GeneratingTransactionProps {
  onDoneClick: () => void;
  transactionComplete: boolean;
  progress?: number;
  error?: boolean;
}

export const GeneratingTransaction: React.FC<GeneratingTransactionProps> = ({
  progress = 80,
  error,
  onDoneClick,
  transactionComplete
}) => {
  const { t } = useTranslation();
  const [outputNotes, downloadAll] = useExportNotes();

  const renderIcon = useCallback(() => {
    if (transactionComplete) {
      return <Icon name={IconName.CheckboxCircleFill} size="xxl" />;
    }
    if (error) {
      return <Icon name={IconName.CloseCircleFill} size="xxl" />;
    }

    return <CircularProgress borderWeight={6} progress={progress} circleColor="black" circleSize={50} spin={true} />;
  }, [transactionComplete, error, progress]);

  const headerText = useCallback(() => {
    if (transactionComplete) {
      return 'Transaction Completed';
    }
    if (error) {
      return 'Transaction Failed';
    }
    return 'Generating Transaction';
  }, [transactionComplete, error]);

  return (
    <>
      <Alert
        variant={AlertVariant.Warning}
        title="Do not close this window. Window will auto-close after the transaction is generated"
      />
      <div className="flex-1 flex flex-col justify-center md:w-[460px] md:mx-auto">
        <div className="flex flex-col justify-center items-center">
          <div
            className={classNames(
              'w-40 aspect-square flex items-center justify-center',
              'rounded-full bg-gradient-to-t from-white to-[#F9F9F9]'
            )}
          >
            {renderIcon()}
          </div>
          <div className="flex flex-col items-center">
            <h1 className="font-semibold text-2xl lh-title">{headerText()}</h1>
            <p className="text-base text-center lh-title">
              {transactionComplete && 'Your transaction was successfully processed and confirmed on the network.'}
              {error && 'There was an error processing your transaction. Please try again.'}
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-y-4">
          {outputNotes.length > 0 && transactionComplete && (
            <Button
              title="Download Transaction Files"
              variant={ButtonVariant.Secondary}
              className="flex-1"
              onClick={downloadAll}
            />
          )}
          <Button
            title={t('done')}
            variant={ButtonVariant.Primary}
            onClick={onDoneClick}
            disabled={!transactionComplete && !error}
          />
        </div>
      </div>
    </>
  );
};
