import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import CircularProgress from 'app/atoms/CircularProgress';
import { closeConsumingFullPage } from 'app/env';
import { Icon, IconName } from 'app/icons/v2';
import { Alert, AlertVariant } from 'components/Alert';
import { Button, ButtonVariant } from 'components/Button';
import { safeGenerateTransactionsLoop as dbTransactionsLoop, initiateConsumeTransaction } from 'lib/miden/activity';
import { useAccount, useMidenContext } from 'lib/miden/front';
import { useClaimableNotes } from 'lib/miden/front/claimable-notes';
import { isDelegateProofEnabled } from 'lib/settings/helpers';
import { truncateHash } from 'utils/string';

const NOTE_CONSUME_TIMEOUT = 30_000;
const AUTO_CLOSE_TIMEOUT = 5_000;

const enum ConsumingNoteStatus {
  Waiting,
  TxQueued,
  Completed,
  Failed
}

export interface ConsumingNotePageProps {
  noteId: string;
}

export const ConsumingNotePage: FC<ConsumingNotePageProps> = ({ noteId }) => {
  console.log('[ConsumingNotePage] Rendering with noteId:', noteId);
  const [status, setStatus] = useState(ConsumingNoteStatus.Waiting);
  const [noteConsumeTimedOut, setNoteConsumeTimedOut] = useState(false);
  const [noteConsumeTimeoutId, setNoteConsumeTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { signTransaction } = useMidenContext();
  const account = useAccount();
  const isDelegatedProvingEnabled = isDelegateProofEnabled();

  const shouldFetchClaimableNotes = status === ConsumingNoteStatus.Waiting;
  const { data: claimableNotes = [] } = useClaimableNotes(account.publicKey, shouldFetchClaimableNotes);

  const noteToConsume = useMemo(() => {
    const note = claimableNotes.find(note => note!.id === noteId);
    return note;
  }, [claimableNotes, noteId]);

  const tryConsumeNote = useCallback(async () => {
    console.log(
      '[ConsumingNote] tryConsumeNote called, status:',
      status,
      'noteToConsume:',
      noteToConsume?.id,
      'timedOut:',
      noteConsumeTimedOut
    );
    if (noteConsumeTimedOut) {
      console.log('[ConsumingNote] Note consume timed out, setting TxQueued');
      setStatus(ConsumingNoteStatus.TxQueued);
      return;
    }

    if (!noteToConsume) {
      console.log('[ConsumingNote] No note to consume yet');
      return;
    }

    // If isBeingClaimed is true, the note is already queued for transaction generation
    if (!noteToConsume.isBeingClaimed) {
      console.log('[ConsumingNote] Calling initiateConsumeTransaction...');
      await initiateConsumeTransaction(account.publicKey, noteToConsume, isDelegatedProvingEnabled);
      console.log('[ConsumingNote] initiateConsumeTransaction completed');
    } else {
      console.log('[ConsumingNote] Note is already being claimed');
    }
    setStatus(ConsumingNoteStatus.TxQueued);
  }, [account.publicKey, noteToConsume, isDelegatedProvingEnabled, noteConsumeTimedOut, status]);

  const generateTransaction = useCallback(async () => {
    console.log('[ConsumingNote] generateTransaction called, calling dbTransactionsLoop...');
    const success = await dbTransactionsLoop(signTransaction);
    console.log('[ConsumingNote] dbTransactionsLoop returned:', success);
    if (success === false) {
      setStatus(ConsumingNoteStatus.Failed);
    } else {
      setStatus(ConsumingNoteStatus.Completed);
    }
  }, [setStatus, signTransaction]);

  const onClose = useCallback(() => {
    const { hash } = window.location;
    if (!hash.includes('consuming-note')) {
      // If we're not on the consuming note page, don't close the window
      return;
    }

    closeConsumingFullPage(noteId);
  }, [noteId]);

  useEffect(() => {
    console.log('[ConsumingNotePage] useEffect triggered, status:', status);
    if (status === ConsumingNoteStatus.Waiting) {
      console.log('[ConsumingNotePage] Status is Waiting');
      // Notes may be claimed in the background, so the timeout prevents endless waiting
      if (!noteConsumeTimeoutId) {
        const timeoutId = setTimeout(() => {
          setNoteConsumeTimedOut(true);
        }, NOTE_CONSUME_TIMEOUT);
        setNoteConsumeTimeoutId(timeoutId);
      }
      tryConsumeNote();
    } else if (status === ConsumingNoteStatus.TxQueued) {
      console.log('[ConsumingNotePage] Status is TxQueued, calling generateTransaction');
      generateTransaction();
    } else {
      console.log('[ConsumingNotePage] Status is:', status, '- auto closing in', AUTO_CLOSE_TIMEOUT, 'ms');
      setTimeout(() => {
        onClose();
      }, AUTO_CLOSE_TIMEOUT);
    }
  }, [tryConsumeNote, status, generateTransaction, onClose, noteToConsume, noteConsumeTimeoutId]);

  // On mobile, use h-full to inherit from parent chain (body has safe area padding)
  const isMobileDevice = typeof window !== 'undefined' && /Android|iPhone|iPad/i.test(navigator.userAgent);
  const containerClass = isMobileDevice
    ? 'h-full w-full'
    : 'h-[640px] max-h-[640px] w-[600px] max-w-[600px] border rounded-3xl';

  return (
    <div
      className={classNames(
        containerClass,
        'mx-auto overflow-hidden ',
        'flex flex-1',
        'flex-col bg-white p-6',
        'overflow-hidden relative'
      )}
    >
      <div className={classNames('flex flex-1 flex-col w-full')}>
        <ConsumingNote noteId={noteId} onDoneClick={onClose} status={status} />
      </div>
    </div>
  );
};

export interface ConsumingNoteProps {
  noteId: string;
  onDoneClick: () => void;
  status: ConsumingNoteStatus;
}

export const ConsumingNote: React.FC<ConsumingNoteProps> = ({ noteId, onDoneClick, status }) => {
  const { t } = useTranslation();

  const renderIcon = useCallback(() => {
    if (status === ConsumingNoteStatus.Completed) {
      return <Icon name={IconName.Success} size="3xl" />;
    }
    if (status === ConsumingNoteStatus.Failed) {
      return <Icon name={IconName.Failed} size="3xl" />;
    }

    return (
      <div className="flex items-center justify-center">
        <Icon name={IconName.InProgress} className="absolute" size="3xl" />
        <CircularProgress borderWeight={2} progress={50} circleColor="black" circleSize={55} spin={true} />
      </div>
    );
  }, [status]);

  const headerText = useCallback(() => {
    switch (status) {
      case ConsumingNoteStatus.Completed:
        return `Note Consumed: ${truncateHash(noteId)}`;
      case ConsumingNoteStatus.Failed:
        return 'Note Consumption Failed';
      case ConsumingNoteStatus.TxQueued:
        return `Generating Transaction`;
      case ConsumingNoteStatus.Waiting:
      default:
        return `Consuming Note: ${truncateHash(noteId)}`;
    }
  }, [status, noteId]);

  const alertText = 'Do not close this window. Window will auto-close after the note is consumed';

  return (
    <>
      {status !== ConsumingNoteStatus.Completed && status !== ConsumingNoteStatus.Failed && (
        <Alert variant={AlertVariant.Warning} title={alertText} />
      )}
      <div className="flex-1 flex flex-col justify-center md:w-[460px] md:mx-auto">
        <div className="flex flex-col justify-center items-center">
          <div className={classNames('w-40 aspect-square flex items-center justify-center mb-8')}>{renderIcon()}</div>
          <div className="flex flex-col items-center">
            <h1 className="font-semibold text-2xl lh-title">{headerText()}</h1>
            <p className="text-base text-center lh-title">
              {status === ConsumingNoteStatus.Completed && t('noteConsumedSuccessfully')}
              {status === ConsumingNoteStatus.Failed && t('noteConsumptionError')}
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-y-4">
          <Button
            title={t('done')}
            variant={ButtonVariant.Primary}
            onClick={onDoneClick}
            disabled={status !== ConsumingNoteStatus.Completed && status !== ConsumingNoteStatus.Failed}
          />
        </div>
      </div>
    </>
  );
};
