import React, { FC, useCallback, useEffect, useState } from 'react';

import { ActivitySpinner } from 'app/atoms/ActivitySpinner';
import { IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import Footer from 'app/layouts/PageLayout/Footer';
import { Button, ButtonVariant } from 'components/Button';
import { getCurrentLocale } from 'lib/i18n';
import { t } from 'lib/i18n/react';
import { getTransactionById } from 'lib/miden/activity';
import { NoteExportType } from 'lib/miden/sdk/constants';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import { capitalizeFirstLetter } from 'utils/string';

import { formatAmount, getTokenMetadata } from './Activity';
import { IActivity } from './IActivity';

interface ActivityDetailsProps {
  transactionId: string;
}

export const ActivityDetails: FC<ActivityDetailsProps> = ({ transactionId }) => {
  const [activity, setActivity] = useState<IActivity | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadTransaction = useCallback(async () => {
    const tx = await getTransactionById(transactionId);
    const tokenMetadata = tx.faucetId ? await getTokenMetadata(tx.faucetId) : undefined;

    const activity = {
      address: tx.accountId,
      key: `completed-${tx.id}`,
      timestamp: tx.completedAt,
      message: tx.displayMessage,
      transactionIcon: tx.displayIcon,
      amount: tx.amount ? formatAmount(tx.amount, tx.type, tokenMetadata?.decimals) : undefined,
      token: tokenMetadata ? tokenMetadata.symbol : undefined,
      secondaryAddress: tx.secondaryAccountId,
      txId: tx.id,
      noteType: tx.noteType,
      noteId: tx.outputNoteIds?.[0]
    } as IActivity;

    setActivity(activity);
  }, [transactionId, setActivity]);

  const handleDownload = useCallback(async () => {
    if (!activity?.noteId) return;

    try {
      setIsDownloading(true);
      const midenClient = await MidenClientInterface.create();
      const noteBytes = await midenClient.exportNote(activity.noteId, NoteExportType.DETAILS);

      const ab = new ArrayBuffer(noteBytes.byteLength);
      new Uint8Array(ab).set(noteBytes);

      const blob = new Blob([ab], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `midenNote${activity.noteId.slice(0, 6)}.mno`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export note:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [activity?.noteId]);

  useEffect(() => {
    if (!activity) loadTransaction();
  }, [loadTransaction, activity]);

  const showDownloadButton = activity?.message === 'Sent' && activity?.noteType === 'private' && activity?.noteId;
  const fromAddress = activity?.message === 'Sent' ? activity?.address : activity?.secondaryAddress;
  const toAddress = activity?.message === 'Sent' ? activity?.secondaryAddress : activity?.address;

  return (
    <PageLayout pageTitle={activity?.message} hasBackAction={true}>
      {activity === null ? (
        <ActivitySpinner />
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col flex-1 py-2 px-4 gap-y-4 md:w-[460px] md:mx-auto">
            <div className="flex flex-col items-center justify-center mb-8">
              <p className="text-4xl font-semibold leading-tight">{activity.amount}</p>
              <p className="text-base leading-normal text-gray-600">{activity.token}</p>
            </div>

            <div className="flex flex-col gap-y-2">
              <span className="flex flex-row justify-between">
                <label className="text-sm text-grey-600">Status</label>
                <p className="text-sm text-green-500">Completed</p>
              </span>
              <span className="flex flex-row justify-between whitespace-pre-line">
                <label className="text-sm text-grey-600">Timestamp</label>
                <p className="text-sm text-right">{formatDate(activity.timestamp)}</p>
              </span>
            </div>

            <hr className="h-px bg-grey-100" />

            <div className="flex flex-col gap-y-2">
              <span className="flex flex-row justify-between">
                <label className="text-sm text-grey-600">From</label>
                <p className="text-sm">{fromAddress}</p>
              </span>
              <span className="flex flex-row justify-between whitespace-pre-line">
                <label className="text-sm text-grey-600">To</label>
                <p className="text-sm text-right">{toAddress}</p>
              </span>
            </div>

            <hr className="h-px bg-grey-100" />

            {activity.noteType && (
              <div className="flex flex-col gap-y-2">
                <span className="flex flex-row justify-between">
                  <label className="text-sm text-grey-600">Note Type</label>
                  <p className="text-sm">{capitalizeFirstLetter(activity.noteType)}</p>
                </span>
              </div>
            )}
            {showDownloadButton && (
              <div className="mt-24 w-full">
                <Button
                  title="Download Generated File"
                  iconLeft={IconName.Download}
                  variant={ButtonVariant.Secondary}
                  className="flex-1 w-full"
                  onClick={handleDownload}
                  isLoading={isDownloading}
                  disabled={isDownloading}
                />
              </div>
            )}
          </div>
        </div>
      )}
      <div className="flex-none w-full absolute bottom-0">
        <Footer />
      </div>
    </PageLayout>
  );
};

const formatDate = (timestamp: number | string): string => {
  let date: Date;

  if (typeof timestamp === 'number') {
    // Ensure the timestamp is in milliseconds
    date = new Date(timestamp * 1000);
  } else if (typeof timestamp === 'string') {
    // Attempt to parse string as number if possible
    const numericTimestamp = parseFloat(timestamp);
    if (!isNaN(numericTimestamp)) {
      date = new Date(numericTimestamp * 1000);
    } else {
      date = new Date(timestamp);
    }
  } else {
    return t('invalidDate');
  }

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error(t('invalidDate'), timestamp);
    return t('invalidDate');
  }

  const currentLanguage = getCurrentLocale();

  const datePart = date.toLocaleString(currentLanguage, {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  });

  const timePart = date.toLocaleString(currentLanguage, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return `${datePart}, ${timePart}`;
};
