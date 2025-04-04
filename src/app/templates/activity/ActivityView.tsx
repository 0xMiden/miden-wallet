import React, { memo, RefObject } from 'react';

import classNames from 'clsx';
import InfiniteScroll from 'react-infinite-scroller';

import { ActivitySpinner } from 'app/atoms/ActivitySpinner';
import { T } from 'lib/i18n/react';

import ActivityItem from './ActivityItem';
import { IActivity } from './IActivity';

type ActivityViewProps = {
  activities: IActivity[];
  initialLoading: boolean;
  loadMore: (page: number) => Promise<void>;
  hasMore: boolean;
  scrollParentRef?: RefObject<HTMLDivElement>;
  fullHistory?: boolean;
  className?: string;
};

const ActivityView = memo<ActivityViewProps>(
  ({ activities, initialLoading, loadMore, hasMore, scrollParentRef, fullHistory, className }) => {
    const noActivities = activities.length === 0;
    const noOperationsClass = fullHistory
      ? 'mt-8 items-center text-left text-black'
      : 'm-4 items-start text-left text-black';

    if (noActivities) {
      return initialLoading ? (
        <ActivitySpinner />
      ) : (
        <div className={classNames('mb-12', 'flex flex-col justify-left', noOperationsClass)}>
          <h3 className="text-sm text-left" style={{ maxWidth: '20rem' }}>
            <T id="noOperationsFound" />
          </h3>
        </div>
      );
    }

    // Handle summary view in Explore page
    if (!scrollParentRef || !fullHistory) {
      return (
        <>
          <div className={classNames('w-full', 'flex flex-col', className)}>
            {activities?.map((activity, index) => (
              <ActivityItem
                activity={activity}
                key={activity.key}
                fullHistory={fullHistory}
                lastActivity={index === activities.length - 1}
              />
            ))}
          </div>
        </>
      );
    }

    // Handle full page view from AllActivity
    return (
      <>
        <div className={classNames('w-full pb-6', 'flex flex-col ', className)}>
          <InfiniteScroll
            loadMore={loadMore}
            hasMore={hasMore}
            useWindow={false}
            getScrollParent={() => scrollParentRef.current}
          >
            {activities?.map((activity, index) => {
              return (
                <ActivityItem
                  activity={activity}
                  key={activity.key}
                  fullHistory={fullHistory}
                  lastActivity={index === activities.length - 1}
                />
              );
            })}
          </InfiniteScroll>
        </div>
      </>
    );
  }
);

export default ActivityView;
