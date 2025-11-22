import React, { FC, memo, useCallback } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import HashShortView from 'app/atoms/HashShortView';
import { useAppEnv } from 'app/env';
import { ReactComponent as BoxIcon } from 'app/icons/box.svg';
import { ReactComponent as ExploreIcon } from 'app/icons/chevron-right.svg';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { ReactComponent as CodeIcon } from 'app/icons/code-alt.svg';
import { ReactComponent as MintIcon } from 'app/icons/mint.svg';
import { ReactComponent as ReceiveIcon } from 'app/icons/receive.svg';
import { ReactComponent as PendingIcon } from 'app/icons/rotate.svg';
import { ReactComponent as SendIcon } from 'app/icons/send.svg';
import { ExploreSelectors } from 'app/pages/Explore.selectors';
import { ITransactionIcon } from 'lib/miden/db/types';
import { Link } from 'lib/woozie';

import { ActivityType, IActivity } from './IActivity';

type ActivityItemProps = {
  activity: IActivity;
  fullHistory?: boolean;
  className?: string;
  lastActivity?: boolean;
};

const iconGrabber = (activityType: ActivityType, iconFillAndStroke: string) => {
  switch (activityType) {
    case ActivityType.PendingTransaction:
    case ActivityType.ProcessingTransaction:
      return <PendingIcon height={'24px'} width={'24px'} />;
    default:
      return <BoxIcon height={'24px'} width={'24px'} fill={iconFillAndStroke} stroke={iconFillAndStroke} />;
  }
};

const transactionIconGrabber = (transactionIcon: ITransactionIcon, iconFillAndStroke: string) => {
  switch (transactionIcon) {
    case 'SEND':
      return (
        <SendIcon
          height={'24px'}
          width={'24px'}
          style={{ paddingLeft: '6px', paddingRight: '6px' }}
          fill={iconFillAndStroke}
        />
      );
    case 'RECEIVE':
      return (
        <ReceiveIcon
          height={'24px'}
          width={'24px'}
          style={{ paddingLeft: '6px', paddingRight: '6px' }}
          fill={iconFillAndStroke}
        />
      );
    case 'MINT':
      return <MintIcon height={'24px'} width={'24px'} />;
    case 'SWAP':
    case 'DEFAULT':
      return <CodeIcon height={'24px'} width={'24px'} fill={iconFillAndStroke} stroke={iconFillAndStroke} />;
    default:
      return <CodeIcon height={'24px'} width={'24px'} fill={iconFillAndStroke} stroke={iconFillAndStroke} />;
  }
};

const ActivityContent: FC<ActivityItemProps> = ({ fullHistory, activity }) => {
  const iconFillAndStroke = fullHistory ? 'currentColor' : 'black';
  const icon = !activity.transactionIcon
    ? iconGrabber(activity.type, iconFillAndStroke)
    : transactionIconGrabber(activity.transactionIcon, iconFillAndStroke);
  const animateSpin = activity.type === ActivityType.ProcessingTransaction ? 'animate-spin' : '';
  const isReceive = activity.transactionIcon === 'RECEIVE' || activity.message === 'Consuming';
  const { popup } = useAppEnv();

  const handleCancelClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      activity.cancel?.();
    },
    [activity]
  );

  return (
    <div className="w-full flex px-4 md:px-6 m-auto py-3 gap-x-2 md:gap-x-4 hover:bg-gray-800 focus:bg-gray-800 transition-colors duration-500 ease-in-out cursor-pointer">
      <div
        className={`flex items-center ${animateSpin}`}
        style={{
          backgroundColor: '#FFE6D9',
          borderRadius: '20px',
          padding: '6px',
          paddingLeft: '8px',
          paddingRight: '8px',
          height: '40px',
          width: '40px'
        }}
      >
        {icon}
      </div>

      <div className="flex items-center flex-grow">
        <div className="flex flex-col flex-grow">
          <div className="text-sm break-all font-medium">
            <span>{activity.message}</span>
          </div>

          <div className="flex text-xs text-gray-600">
            <div>
              {activity.secondaryAddress && (
                <>
                  {`${isReceive ? 'From' : 'To'} `}
                  <HashShortView
                    hash={activity.secondaryAddress}
                    trimHash={popup}
                    firstCharsCount={13}
                    lastCharsCount={7}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {activity.amount && (
        <div className="flex items-center flex-col justify-end">
          <div className={`text-sm self-end font-medium ${isReceive ? 'text-green-500' : ''}`}>{activity.amount}</div>
          {activity.token && (
            <div>
              <span className="text-gray-600">
                <HashShortView hash={activity.token} />
              </span>
            </div>
          )}
        </div>
      )}
      {activity.cancel && (
        <div className="flex justify-end">
          <Button
            className="hover:bg-gray-900 active:bg-gray-800 rounded-md px-1"
            onClick={handleCancelClick}
            testID={ExploreSelectors.CancelTransaction}
          >
            <CloseIcon stroke={iconFillAndStroke} height={'24px'} width={'24px'} />
          </Button>
        </div>
      )}
      {activity.explorerLink && (
        <div className="flex items-center justify-end rounded-md">
          <ExploreIcon stroke={'black'} height={'18px'} width={'18px'} />
        </div>
      )}
    </div>
  );
};

const ActivityItem = memo<ActivityItemProps>(({ className, fullHistory, activity }) => {
  const itemClassName = fullHistory ? 'text-black' : 'text-black';

  return (
    <div className={classNames('w-full', itemClassName, className)}>
      {activity.explorerLink ? (
        <a draggable={false} href={activity.explorerLink} target="_blank" rel="noreferrer">
          {ActivityContent({ className, fullHistory, activity })}
        </a>
      ) : (
        <Link to={`/activity-details/${activity.txId}`}>{ActivityContent({ className, fullHistory, activity })}</Link>
      )}
    </div>
  );
});

export default ActivityItem;
