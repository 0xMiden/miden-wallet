import React, { memo, RefObject, useMemo, useState } from 'react';

import { ACTIVITY_PAGE_SIZE } from 'app/defaults';
import { cancelTransactionById, getCompletedTransactions, getUncompletedTransactions } from 'lib/miden/activity';
import { formatTransactionStatus, ITransactionStatus, ITransactionType } from 'lib/miden/db/types';
import { useRetryableSWR } from 'lib/swr';
import useSafeState from 'lib/ui/useSafeState';

import ActivityView from './ActivityView';
import { ActivityType, IActivity } from './IActivity';
import { getFaucetIdSetting } from '../EditMidenFaucetId';

type ActivityProps = {
  address: string;
  programId?: string | null;
  numItems?: number;
  scrollParentRef?: RefObject<HTMLDivElement>;
  className?: string;
  fullHistory?: boolean;
};

const Activity = memo<ActivityProps>(({ address, className, numItems, scrollParentRef, fullHistory }) => {
  const safeStateKey = useMemo(() => ['activities', address].join('_'), [address]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [restActivities, setRestActivities] = useSafeState<Array<IActivity>>([], safeStateKey);

  const { data: latestTransactions, isValidating: transactionsFetching } = useRetryableSWR(
    [`latest-transactions`, address],
    async () => fetchTransactionsAsActivities(address),
    {
      revalidateOnMount: true,
      refreshInterval: 10_000,
      dedupingInterval: 3_000
    }
  );

  const { data: latestPendingTransactions, mutate: mutateTx } = useRetryableSWR(
    [`latest-pending-transactions`, address],
    async () => fetchPendingTransactionsAsActivities(address),
    {
      revalidateOnMount: true,
      refreshInterval: 5_000,
      dedupingInterval: 3_000
    }
  );
  const pendingTransactions = useMemo(
    () =>
      latestPendingTransactions?.map(tx => {
        tx.cancel = async () => {
          if (tx.txId) {
            await cancelTransactionById(tx.txId);
            mutateTx();
          }
        };
        return tx;
      }) || [],
    [latestPendingTransactions, mutateTx]
  );

  // Don't sort the pending transactions, earliest should come first as they are processed first
  const allActivities = useMemo(
    () => pendingTransactions.concat(mergeAndSort(latestTransactions ?? [], restActivities)),
    [latestTransactions, restActivities, pendingTransactions]
  );

  const loadMore = async (page: number) => {
    // already loading, don't make duplicate calls
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const offset = ACTIVITY_PAGE_SIZE * page;
    const limit = ACTIVITY_PAGE_SIZE;
    const olderTransactions = await fetchTransactionsAsActivities(address, offset, limit);
    const allRestActivities = mergeAndSort(restActivities, olderTransactions);

    if (allRestActivities.length === 0) {
      setHasMore(false);
    }
    setRestActivities(allRestActivities);
    setIsLoading(false);
  };

  let activities: IActivity[] = allActivities;
  if (numItems) {
    const maxIndex = Math.min(numItems, allActivities.length);
    activities = activities.slice(0, maxIndex);
  }

  return (
    <ActivityView
      activities={activities ?? []}
      initialLoading={transactionsFetching}
      loadMore={loadMore}
      hasMore={hasMore}
      scrollParentRef={scrollParentRef}
      fullHistory={fullHistory}
      className={className}
    />
  );
});

export default Activity;

async function fetchTransactionsAsActivities(address: string, offset?: number, limit?: number): Promise<IActivity[]> {
  const transactions = await getCompletedTransactions(address, offset, limit);
  const activities = transactions.map(tx => {
    const updateMessageForFailed = tx.status === ITransactionStatus.Failed ? 'Transaction failed' : tx.displayMessage;
    const icon = tx.status === ITransactionStatus.Failed ? 'FAILED' : tx.displayIcon;
    const activity = {
      address: address,
      key: `completed-${tx.id}`,
      timestamp: Date.now(),
      message: updateMessageForFailed,
      type: ActivityType.CompletedTransaction,
      transactionIcon: icon,
      amount: tx.amount ? formatAmount(tx.amount, tx.type) : undefined,
      token: tx.faucetId ? getTokenId(tx.faucetId) : undefined,
      secondaryAddress: tx.secondaryAccountId,
      txId: tx.id
    } as IActivity;

    return activity;
  });

  return activities;
}

async function fetchPendingTransactionsAsActivities(address: string): Promise<IActivity[]> {
  let pendingTransactions = await getUncompletedTransactions(address);

  const activityPromises = pendingTransactions.map(async tx => {
    const activityType =
      tx.status !== ITransactionStatus.Queued ? ActivityType.ProcessingTransaction : ActivityType.PendingTransaction;
    return {
      key: `pending-${tx.id}`,
      address: address,
      secondaryMessage: formatTransactionStatus(tx.status),
      timestamp: tx.initiatedAt,
      message: tx.displayMessage || 'Generating transaction',
      amount: tx.amount ? formatAmount(tx.amount, tx.type) : undefined,
      token: tx.faucetId ? getTokenId(tx.faucetId) : undefined,
      secondaryAddress: tx.secondaryAccountId,
      txId: tx.id,
      type: activityType
    } as IActivity;
  });
  const activities = await Promise.all(activityPromises);
  return activities;
}

function mergeAndSort(base?: IActivity[], toAppend: IActivity[] = []) {
  if (!base) return [];

  const uniqueKeys = new Set<string>();
  const uniques: IActivity[] = [];
  for (const activity of [...base, ...toAppend]) {
    if (!uniqueKeys.has(activity.key)) {
      uniqueKeys.add(activity.key);
      uniques.push(activity);
    }
  }
  uniques.sort((r1, r2) => r2.timestamp - r1.timestamp || r2.type - r1.type);
  return uniques;
}

const formatAmount = (amount: bigint, transactionType: ITransactionType) => {
  if (transactionType === 'send') {
    return `-${amount}`;
  } else if (transactionType === 'consume') {
    return `+${amount}`;
  }
  return amount;
};

const getTokenId = (faucetId: string) => {
  return faucetId === getFaucetIdSetting() ? 'MIDEN' : faucetId;
};
