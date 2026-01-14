import React, { FC, useCallback, useEffect, useState, memo } from 'react';

import { ActivitySpinner } from 'app/atoms/ActivitySpinner';
import { useMidenClient } from 'app/hooks/useMidenClient';
import { IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import { Button, ButtonVariant } from 'components/Button';
import { useTranslation } from 'react-i18next';

import { getCurrentLocale } from 'lib/i18n';
import { getTransactionById } from 'lib/miden/activity';
import { useAllAccounts, useAccount } from 'lib/miden/front';
import { getTokenMetadata } from 'lib/miden/metadata/utils';
import { NoteExportType } from 'lib/miden/sdk/constants';
import { formatAmount } from 'lib/shared/format';
import { WalletAccount } from 'lib/shared/types';
import { capitalizeFirstLetter } from 'utils/string';

import AddressChip from '../AddressChip';
import HashChip from '../HashChip';
import { IActivity } from './IActivity';

interface ActivityDetailsProps {
  transactionId: string;
}

const StatusDisplay: FC<{ message: string }> = memo(({ message }) => {
  const { t } = useTranslation();
  let displayTextKey = '';
  let textColorClass = '';

  const isCompleted = message === 'Sent' || message === 'Received';

  if (isCompleted) {
    displayTextKey = 'completed';
    textColorClass = 'text-green-500';
  } else {
    displayTextKey = 'inProgress';
    textColorClass = 'text-blue-500';
  }

  return <p className={`text-sm ${textColorClass}`}>{t(displayTextKey)}</p>;
});

const AccountDisplay: FC<{
  address: string | undefined;
  account: WalletAccount;
  allAccounts: WalletAccount[];
}> = memo(({ address, account, allAccounts }) => {
  const { t } = useTranslation();
  if (!address) return <p className="text-sm">{address}</p>;

  const getDisplayName = (publicKey: string): string | undefined => {
    if (account?.publicKey === publicKey) {
      return `${t('you')} (${account.name})`;
    }

    const matchingAccount = allAccounts.find(acc => acc.publicKey === publicKey);
    if (matchingAccount) {
      return `${t('you')} (${matchingAccount.name})`;
    }

    return undefined;
  };
  const displayName = getDisplayName(address);

  return <AddressChip address={address} fill="#9E9E9E" className="ml-2" displayName={displayName} />;
});

export const ActivityDetails: FC<ActivityDetailsProps> = ({ transactionId }) => {
  const { t } = useTranslation();
  const allAccounts = useAllAccounts();
  const account = useAccount();
  const { midenClient } = useMidenClient();
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
      noteId: tx.outputNoteIds?.[0],
      externalTxId: tx.transactionId
    } as IActivity;

    setActivity(activity);
  }, [transactionId, setActivity]);

  const handleDownload = useCallback(async () => {
    if (!activity?.noteId) return;
    if (!midenClient) return;

    try {
      setIsDownloading(true);
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
  }, [activity?.noteId, midenClient]);

  const handleViewOnExplorer = useCallback(() => {
    if (!activity?.externalTxId) return;
    window.open(`https://testnet.midenscan.com/tx/${activity.externalTxId}`, '_blank');
  }, [activity]);

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
          <div className="flex flex-col flex-1 py-2 px-4 justify-between md:w-[460px] md:mx-auto">
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col items-center justify-center mb-8">
                <p className="text-4xl font-semibold leading-tight">{activity.amount}</p>
                <p className="text-base leading-normal text-gray-600">{activity.token}</p>
              </div>

              <div className="flex flex-col gap-y-2">
                <span className="flex flex-row justify-between">
                  <label className="text-sm text-grey-600">{t('status')}</label>
                  <StatusDisplay message={activity.message} />
                </span>
                <span className="flex flex-row justify-between whitespace-pre-line">
                  <label className="text-sm text-grey-600">{t('timestamp')}</label>
                  <p className="text-sm text-right">{formatDate(activity.timestamp)}</p>
                </span>
              </div>

              <hr className="h-px bg-grey-100" />

              <div className="flex flex-col gap-y-2">
                <span className="flex flex-row justify-between">
                  <label className="text-sm text-grey-600">{t('from')}</label>
                  <AccountDisplay address={fromAddress} account={account} allAccounts={allAccounts} />
                </span>
                <span className="flex flex-row justify-between whitespace-pre-line">
                  <label className="text-sm text-grey-600">{t('to')}</label>
                  <AccountDisplay address={toAddress} account={account} allAccounts={allAccounts} />
                </span>
              </div>

              <hr className="h-px bg-grey-100" />

              {activity.noteType && (
                <div className="flex flex-col gap-y-2">
                  <span className="flex flex-row justify-between">
                    <label className="text-sm text-grey-600">{t('noteType')}</label>
                    <p className="text-sm">{capitalizeFirstLetter(activity.noteType)}</p>
                  </span>
                </div>
              )}
              {activity.noteId && (
                <div className="flex flex-col gap-y-2">
                  <span className="flex flex-row justify-between">
                    <label className="text-sm text-grey-600">{t('noteId')}</label>
                    <HashChip hash={activity.noteId || ''} trimHash={true} fill="#9E9E9E" className="ml-2" />
                  </span>
                </div>
              )}
            </div>

            <div className="mb-4">
              {showDownloadButton && (
                <div className="w-full">
                  <Button
                    title={t('downloadGeneratedFile')}
                    iconLeft={IconName.Download}
                    variant={ButtonVariant.Ghost}
                    className="flex-1 w-full"
                    onClick={handleDownload}
                    isLoading={isDownloading}
                    disabled={isDownloading}
                  />
                </div>
              )}
              <div className="mt-2 w-full">
                <Button
                  title={t('viewOnExplorer')}
                  iconLeft={IconName.Globe}
                  variant={ButtonVariant.Secondary}
                  className="flex-1 w-full"
                  onClick={handleViewOnExplorer}
                />
              </div>
            </div>
          </div>
        </div>
      )}
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
    return 'Invalid Date';
  }

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error('Invalid Date', timestamp);
    return 'Invalid Date';
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
