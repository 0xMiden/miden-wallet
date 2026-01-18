import React, { memo, RefObject } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroller';

import { ActivitySpinner } from 'app/atoms/ActivitySpinner';

import HistoryItem from './HistoryItem';
import { IHistoryEntry } from './IHistoryEntry';

type HistoryViewProps = {
  entries: IHistoryEntry[];
  initialLoading: boolean;
  loadMore: (page: number) => Promise<void>;
  hasMore: boolean;
  scrollParentRef?: RefObject<HTMLDivElement>;
  fullHistory?: boolean;
  className?: string;
};

const HistoryView = memo<HistoryViewProps>(
  ({ entries, initialLoading, loadMore, hasMore, scrollParentRef, fullHistory, className }) => {
    const { t } = useTranslation();
    const noEntries = entries.length === 0;
    const noOperationsClass = fullHistory
      ? 'mt-8 items-center text-left text-black'
      : 'm-4 items-start text-left text-black';

    if (noEntries) {
      return initialLoading ? (
        <ActivitySpinner />
      ) : (
        <div className={classNames('mb-12', 'flex flex-col justify-left', noOperationsClass)}>
          <h3 className="text-sm text-left" style={{ maxWidth: '20rem' }}>
            {t('noOperationsFound')}
          </h3>
        </div>
      );
    }

    // Handle summary view in Explore page
    if (!scrollParentRef || !fullHistory) {
      return (
        <>
          <div className={classNames('w-full', 'flex flex-col', className)}>
            {entries?.map((entry, index) => (
              <HistoryItem
                entry={entry}
                key={entry.key}
                fullHistory={fullHistory}
                lastEntry={index === entries.length - 1}
              />
            ))}
          </div>
        </>
      );
    }

    // Handle full page view from AllHistory
    return (
      <>
        <div className={classNames('w-full pb-6', 'flex flex-col ', className)}>
          <InfiniteScroll
            loadMore={loadMore}
            hasMore={hasMore}
            useWindow={false}
            getScrollParent={() => scrollParentRef.current}
          >
            {entries?.map((entry, index) => {
              return (
                <HistoryItem
                  entry={entry}
                  key={entry.key}
                  fullHistory={fullHistory}
                  lastEntry={index === entries.length - 1}
                />
              );
            })}
          </InfiniteScroll>
        </div>
      </>
    );
  }
);

export default HistoryView;
