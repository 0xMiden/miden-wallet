/* eslint-disable @typescript-eslint/no-unused-expressions */

import React, { FC, useCallback, useEffect, useRef } from 'react';

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
import { consumeNoteId } from 'lib/miden-worker/consumeNoteId';
import { sendTransaction } from 'lib/miden-worker/sendTransaction';
import { putToStorage } from 'lib/miden/front';
import {
  EXPORTED_NOTES_KEY,
  NoteDownload,
  QUEUED_TRANSACTIONS_KEY,
  safeGenerateTransactionsLoop,
  useQueuedTransactions
} from 'lib/miden/front/queued-transactions';
import { navigate } from 'lib/woozie';

export interface GeneratingTransactionPageProps {
  keepOpen?: boolean;
}

export const GeneratingTransactionPage: FC<GeneratingTransactionPageProps> = ({ keepOpen = false }) => {
  const { pageEvent, trackEvent } = useAnalytics();
  const [transactions, , exportedNotes] = useQueuedTransactions();

  const clearStorage = useCallback(() => {
    putToStorage(QUEUED_TRANSACTIONS_KEY, []);
    putToStorage(EXPORTED_NOTES_KEY, []);
  }, []);

  const onClose = useCallback(() => {
    clearStorage();
    if (keepOpen) {
      navigate('/');
      return;
    }

    closeLoadingFullPage();
  }, [keepOpen, clearStorage]);

  useEffect(() => {
    pageEvent('GeneratingTransaction', '');
  }, [pageEvent]);

  const prevTransactionsLength = useRef<number>();
  const lastDownloadedNote = useRef<number | null>(null);
  useEffect(() => {
    if (
      exportedNotes.length === 0 &&
      prevTransactionsLength.current &&
      prevTransactionsLength.current > 0 &&
      transactions.length === 0
    ) {
      new Promise(res => setTimeout(res, 10_000)).then(async () => {
        await trackEvent('GeneratingTransaction Page Closed Automatically');
        isAutoCloseEnabled() && onClose();
      });
    }

    if (
      exportedNotes.length > 0 &&
      (!lastDownloadedNote.current || lastDownloadedNote.current < exportedNotes.length - 1)
    ) {
      new Promise(res => setTimeout(res, 1_000)).then(async () => {
        const downloadLinks = document.getElementsByClassName('generating-transaction-page-note-download-link flex');
        const startIndex = lastDownloadedNote.current === null ? 0 : lastDownloadedNote.current + 1;
        if (downloadLinks.length > 0) {
          for (let i = startIndex; i < exportedNotes.length; i++) {
            (downloadLinks[i] as HTMLAnchorElement).click();
          }
          lastDownloadedNote.current = exportedNotes.length - 1;
        }
      });
    }

    prevTransactionsLength.current = transactions.length;
  }, [transactions, trackEvent, exportedNotes, onClose]);

  useEffect(() => {
    safeGenerateTransactionsLoop(consumeNoteId, sendTransaction);
    setInterval(() => {
      safeGenerateTransactionsLoop(consumeNoteId, sendTransaction);
    }, 5_000);
  }, []);

  useBeforeUnload(t('generatingTransactionWarning'), transactions.length !== 0, clearStorage);
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
          exportedNotes={exportedNotes}
          progress={progress}
          onDoneClick={onClose}
          transactionComplete={transactions.length === 0}
        />
      </div>
    </div>
  );
};

export interface GeneratingTransactionProps {
  exportedNotes: NoteDownload[];
  onDoneClick: () => void;
  transactionComplete: boolean;
  progress?: number;
  error?: boolean;
}

export const GeneratingTransaction: React.FC<GeneratingTransactionProps> = ({
  exportedNotes,
  progress = 80,
  error,
  onDoneClick,
  transactionComplete
}) => {
  const { t } = useTranslation();

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
          {exportedNotes.length > 0 &&
            transactionComplete &&
            exportedNotes.map(note => (
              <a
                href={note.downloadUrl}
                key={note.noteId}
                download={`midenNote${note.noteId.slice(0, 6)}.mno`}
                className="generating-transaction-page-note-download-link flex"
              >
                <Button title="Download Transaction File" variant={ButtonVariant.Secondary} className="flex-1" />
              </a>
            ))}
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
