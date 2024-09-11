import React, { memo, useMemo, RefObject, useState } from 'react';

import { ACTIVITY_PAGE_SIZE } from 'app/defaults';

import { formatTransactionStatus, ITransactionStatus } from 'lib/miden/db/transaction-types';

import { ALEO_DECIMALS } from 'lib/fiat-curency/consts';
import { formatBigInt } from 'lib/i18n/numbers';
import { useRetryableSWR } from 'lib/swr';
import useSafeState from 'lib/ui/useSafeState';

import ActivityView from './ActivityView';
import { ActivityType, IActivity } from './IActivity';

type ActivityProps = {
  address: string;
  programId?: string | null;
  numItems?: number;
  scrollParentRef?: RefObject<HTMLDivElement>;
  className?: string;
  fullHistory?: boolean;
};

const Activity = memo<ActivityProps>(({ address, programId, className, numItems, scrollParentRef, fullHistory }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async (page: number) => {
    // already loading, don't make duplicate calls
    if (isLoading) {
      return;
    }
    setIsLoading(true);
    const offset = ACTIVITY_PAGE_SIZE * page;
    const limit = ACTIVITY_PAGE_SIZE;

    setIsLoading(false);
  };

  return (
    <ActivityView
      activities={[]}
      initialLoading={false}
      loadMore={loadMore}
      hasMore={hasMore}
      scrollParentRef={scrollParentRef}
      fullHistory={fullHistory}
      className={className}
    />
  );
});

export default Activity;

async function fetchTransactionsAsActivities(
  address: string,
  programId?: string | null,
  offset?: number,
  limit?: number
) {}

async function fetchPendingTransactionsAsActivities(address: string) {}

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
