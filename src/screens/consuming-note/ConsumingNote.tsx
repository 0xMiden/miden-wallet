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
import { isAutoConsumeEnabled, isDelegateProofEnabled } from 'lib/settings/helpers';
import { truncateHash } from 'utils/string';

const AUTO_CLOSE_TIMEOUT = 5_000;

const enum ConsumingNoteStatus {
  Waiting,
  Queued,
  Completed,
  Failed
}

export interface ConsumingNotePageProps {
  noteId: string;
}

export const ConsumingNotePage: FC<ConsumingNotePageProps> = ({ noteId }) => {
  const [consumingStatus, setConsumingStatus] = useState(ConsumingNoteStatus.Waiting);

  const { signTransaction } = useMidenContext();
  const account = useAccount();
  const { data: claimableNotes = [] } = useClaimableNotes(account.publicKey);
  const isDelegatedProvingEnabled = isDelegateProofEnabled();
  const shouldAutoConsume = isAutoConsumeEnabled();

  const noteToConsume = useMemo(() => {
    const note = claimableNotes.find(note => note!.id === noteId);
    return note;
  }, [claimableNotes, noteId]);

  const consumeNote = useCallback(async () => {
    if (!noteToConsume) {
      return;
    }

    await initiateConsumeTransaction(account.publicKey, noteToConsume, isDelegatedProvingEnabled);
    setConsumingStatus(ConsumingNoteStatus.Queued);
  }, [account.publicKey, noteToConsume, isDelegatedProvingEnabled]);

  const generateTransaction = useCallback(async () => {
    const success = await dbTransactionsLoop(signTransaction);
    if (success === false) {
      setConsumingStatus(ConsumingNoteStatus.Failed);
    } else {
      setConsumingStatus(ConsumingNoteStatus.Completed);
    }
  }, [setConsumingStatus, signTransaction]);

  const onClose = useCallback(() => {
    const { hash } = window.location;
    if (!hash.includes('consuming-note')) {
      // If we're not on the consuming note page, don't close the window
      return;
    }

    closeConsumingFullPage(noteId);
  }, [noteId]);

  useEffect(() => {
    if (shouldAutoConsume && consumingStatus === ConsumingNoteStatus.Waiting) {
      consumeNote();
    } else if (consumingStatus === ConsumingNoteStatus.Queued) {
      generateTransaction();
    } else {
      setTimeout(() => {
        onClose();
      }, AUTO_CLOSE_TIMEOUT);
    }
  }, [shouldAutoConsume, consumeNote, consumingStatus, generateTransaction, onClose]);

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
        <ConsumingNote noteId={noteId} onDoneClick={onClose} status={consumingStatus} />
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
      case ConsumingNoteStatus.Queued:
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
              {status === ConsumingNoteStatus.Completed && 'Your note was successfully consumed.'}
              {status === ConsumingNoteStatus.Failed && 'There was an error consuming your note. Please try again.'}
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
