/* eslint-disable @typescript-eslint/no-unused-expressions */

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import CircularProgress from 'app/atoms/CircularProgress';
import { closeLoadingFullPage } from 'app/env';
import useBeforeUnload from 'app/hooks/useBeforeUnload';
import { Icon, IconName } from 'app/icons/v2';
import { Alert, AlertVariant } from 'components/Alert';
import { Button, ButtonVariant } from 'components/Button';
import { useAnalytics } from 'lib/analytics';
import { safeGenerateTransactionsLoop as dbTransactionsLoop, getAllUncompletedTransactions } from 'lib/miden/activity';
import { useExportNotes } from 'lib/miden/activity/notes';
import { useMidenContext } from 'lib/miden/front';
import { isAutoCloseEnabled } from 'lib/settings/helpers';
import { useRetryableSWR } from 'lib/swr';
import { navigate } from 'lib/woozie';

export interface GeneratingTransactionPageProps {
  keepOpen?: boolean;
}

export const GeneratingTransactionPage: FC<GeneratingTransactionPageProps> = ({ keepOpen = false }) => {
  const { signTransaction } = useMidenContext();
  const { pageEvent, trackEvent } = useAnalytics();
  const [outputNotes, downloadAll] = useExportNotes();
  const [error, setError] = useState(false);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeOutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: txs, mutate: mutateTx } = useRetryableSWR(
    [`all-latest-generating-transactions`],
    async () => getAllUncompletedTransactions(),
    {
      revalidateOnMount: true,
      refreshInterval: 5_000,
      dedupingInterval: 3_000
    }
  );
  console.log('Rendering GeneratingTransactionPage with txs:', txs);
  const onClose = useCallback(() => {
    const { hash } = window.location;
    if (!hash.includes('generating-transaction')) {
      // If we're not on the generating transaction page, don't close the window
      return;
    }

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
      new Promise(res => (timeOutRef.current = setTimeout(res, 10_000))).then(async () => {
        await trackEvent('GeneratingTransaction Page Closed Automatically');
        isAutoCloseEnabled() && onClose();
      });
    } else if (timeOutRef.current) {
      clearTimeout(timeOutRef.current);
      timeOutRef.current = null;
    }
    prevTransactionsLength.current = transactions.length;
  }, [transactions, trackEvent, outputNotes, onClose]);
  const generateTransaction = useCallback(async () => {
    try {
      const success = await dbTransactionsLoop(signTransaction);
      if (success === false) {
        setError(true);
      }

      await mutateTx();
    } catch {
      setError(true);
    }
  }, [mutateTx, signTransaction]);

  useEffect(() => {
    if (error && transactions.length === 0) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }
    // Continue processing transactions even if there was an error,
    // as long as there are transactions in the queue
    generateTransaction();
    intervalIdRef.current = setInterval(() => {
      generateTransaction();
    }, 5_000);
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    };
  }, [generateTransaction, error, transactions.length]);

  useBeforeUnload(!error && transactions.length !== 0, downloadAll);
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
          keepOpen={keepOpen}
          error={error}
        />
      </div>
    </div>
  );
};

export interface GeneratingTransactionProps {
  onDoneClick: () => void;
  transactionComplete: boolean;
  error: boolean;
  keepOpen?: boolean;
  progress?: number;
}

export const GeneratingTransaction: React.FC<GeneratingTransactionProps> = ({
  onDoneClick,
  transactionComplete,
  error,
  keepOpen,
  progress = 80
}) => {
  const { t } = useTranslation();
  const [outputNotes, downloadAll] = useExportNotes();

  const renderIcon = useCallback(() => {
    if (transactionComplete && !error) {
      return <Icon name={IconName.Success} size="3xl" />;
    }
    if (error) {
      return <Icon name={IconName.Failed} size="3xl" />;
    }

    return (
      <div className="flex items-center justify-center">
        <Icon name={IconName.InProgress} className="absolute" size="3xl" />
        <CircularProgress borderWeight={2} progress={progress} circleColor="black" circleSize={55} spin={true} />
      </div>
    );
  }, [transactionComplete, error, progress]);

  const headerText = useCallback(() => {
    if (transactionComplete && !error) {
      return t('transactionCompleted');
    }
    if (error) {
      return t('transactionFailed');
    }
    return t('generatingTransaction');
  }, [transactionComplete, error, t]);

  const alertText = useCallback(() => {
    if (keepOpen) {
      return t('doNotCloseWindowNavigateHome');
    }

    return t('doNotCloseWindowAutoClose');
  }, [keepOpen, t]);

  return (
    <>
      {!transactionComplete && !error && <Alert variant={AlertVariant.Warning} title={alertText()} />}
      <div className="flex-1 flex flex-col justify-center md:w-[460px] md:mx-auto">
        <div className="flex flex-col justify-center items-center">
          <div className={classNames('w-40 aspect-square flex items-center justify-center mb-8')}>{renderIcon()}</div>
          <div className="flex flex-col items-center">
            <h1 className="font-semibold text-2xl lh-title">{headerText()}</h1>
            <p className="text-base text-center lh-title">
              {!error && transactionComplete && t('transactionSuccessDescription')}
              {error && t('transactionErrorDescription')}
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-y-4">
          {outputNotes.length > 0 && transactionComplete && !error && (
            <Button
              title={t('downloadGeneratedFiles')}
              iconLeft={IconName.Download}
              variant={ButtonVariant.Primary}
              className="flex-1"
              onClick={downloadAll}
            />
          )}
          <Button
            title={t('done')}
            variant={outputNotes.length > 0 ? ButtonVariant.Secondary : ButtonVariant.Primary}
            onClick={onDoneClick}
            disabled={!transactionComplete && !error}
          />
        </div>
      </div>
    </>
  );
};
