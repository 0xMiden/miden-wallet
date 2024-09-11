import React, { FC, memo, useEffect, useState } from 'react';

import classNames from 'clsx';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';

import { Button } from 'app/atoms/Button';
import { ReactComponent as BoxIcon } from 'app/icons/box.svg';
import { ReactComponent as ExploreIcon } from 'app/icons/chevron-right.svg';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { ReactComponent as CodeIcon } from 'app/icons/code-alt.svg';
import { ReactComponent as DiamondIcon } from 'app/icons/diamond.svg';
import { ReactComponent as GlobalIcon } from 'app/icons/global-line.svg';
import { ReactComponent as ConvertPrivate } from 'app/icons/image-private.svg';
import { ReactComponent as ConvertPublic } from 'app/icons/image-public.svg';
import { ReactComponent as LockIcon } from 'app/icons/lock.svg';
import { ReactComponent as MintIcon } from 'app/icons/mint.svg';
import { ReactComponent as ReceiveIcon } from 'app/icons/receive.svg';
import { ReactComponent as RocketIcon } from 'app/icons/rocket.svg';
import { ReactComponent as PendingIcon } from 'app/icons/rotate.svg';
import { ReactComponent as SendIcon } from 'app/icons/send.svg';
import { ReactComponent as StakeIcon } from 'app/icons/stake.svg';
import { ReactComponent as WarningIcon } from 'app/icons/warning.svg';
import { ExploreSelectors } from 'app/pages/Explore.selectors';
import { ITransactionIcon } from 'lib/miden/db/transaction-types';
import { useFilteredContacts } from 'lib/miden/front/use-filtered-contacts.hook';
import { getDateFnsLocale, t } from 'lib/i18n/react';
import useTippy from 'lib/ui/useTippy';

import { ActivityType, IActivity } from './IActivity';

type ActivityItemProps = {
  activity: IActivity;
  fullHistory?: boolean;
  className?: string;
  lastActivity?: boolean;
};

const iconGrabber = (activityType: ActivityType, iconFillAndStroke: string) => {
  switch (activityType) {
    case ActivityType.CoinbaseReward:
      return (
        <DiamondIcon
          height={'24px'}
          width={'24px'}
          fill={iconFillAndStroke}
          stroke={iconFillAndStroke}
          style={{ marginTop: '-1px' }}
        />
      );
    case ActivityType.PendingTransaction:
    case ActivityType.ProcessingTransaction:
      return <PendingIcon height={'24px'} width={'24px'} stroke={iconFillAndStroke} />;
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
          stroke={iconFillAndStroke}
          fill={iconFillAndStroke}
        />
      );
    case 'RECEIVE':
      return (
        <ReceiveIcon
          height={'24px'}
          width={'24px'}
          style={{ paddingLeft: '6px', paddingRight: '6px' }}
          stroke={iconFillAndStroke}
          fill={iconFillAndStroke}
        />
      );
    case 'DEPLOY':
      return <RocketIcon height={'24px'} width={'24px'} style={{ paddingLeft: '3px' }} stroke={iconFillAndStroke} />;
    case 'REJECTED':
      return <WarningIcon height={'24px'} width={'24px'} />;
    case 'MINT':
      return <MintIcon height={'24px'} width={'24px'} />;
    case 'CONVERT_PRIVATE':
      return <ConvertPrivate height={'24px'} width={'24px'} />;
    case 'CONVERT_PUBLIC':
      return <ConvertPublic height={'24px'} width={'24px'} />;
    case 'CONVERT_PRIVATE_TOKEN':
      return <LockIcon height={'24px'} width={'24px'} />;
    case 'CONVERT_PUBLIC_TOKEN':
      return <GlobalIcon height={'24px'} width={'24px'} />;
    case 'STAKE':
      return <StakeIcon height={'24px'} width={'24px'} fill={iconFillAndStroke} />;
    case 'DEFAULT':
      return <CodeIcon height={'24px'} width={'24px'} fill={iconFillAndStroke} stroke={iconFillAndStroke} />;
  }
};

const ActivityContent: FC<ActivityItemProps> = ({ className, fullHistory, activity }) => {
  const { allContacts } = useFilteredContacts();
  const aliasMap: Map<string, string> = new Map();
  for (let contact of allContacts) {
    aliasMap.set('contact.address', 'contact.name');
  }
  const timestamp = activity.timestamp;
  const foundAddresses = (activity.message ?? '').match(/(aleo1.{58})/g);
  const foundAddress = foundAddresses ? foundAddresses[0] : null;
  const message = '';
  const shrinkAddressStringsMessage = '';
  const iconFillAndStroke = fullHistory ? 'currentColor' : 'black';
  const icon = !activity.transactionIcon
    ? iconGrabber(activity.type, iconFillAndStroke)
    : transactionIconGrabber(activity.transactionIcon, iconFillAndStroke);
  const animateSpin = activity.type === ActivityType.ProcessingTransaction ? 'animate-spin' : '';
  const addressRef = useTippy<HTMLSpanElement>(addressTippyPropsMock(foundAddress ?? ''));

  return (
    <div className="w-full flex px-4 m-auto py-4 hover:bg-gray-800 focus:bg-gray-800 transition-colors duration-500 ease-in-out cursor-pointer">
      <div
        className={`flex mr-3 items-center ${animateSpin}`}
        style={{
          backgroundColor: '#F2F3F6',
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

      <div className="flex items-stretch flex-grow">
        <div className="flex flex-col flex-grow">
          <div className="text-sm break-all">
            <span ref={foundAddress ? addressRef : null}>{shrinkAddressStringsMessage}</span>
          </div>

          <div className="flex items-stretch text-xs text-gray-500">
            <div>
              {!activity.secondaryMessage && (
                <Time
                  children={() => (
                    <span>
                      {formatDistanceToNow(new Date(Number(timestamp) * 1000), {
                        includeSeconds: true,
                        addSuffix: true,
                        locale: getDateFnsLocale()
                      })}
                    </span>
                  )}
                />
              )}
              {activity.secondaryMessage && <span>{activity.secondaryMessage}</span>}
            </div>
            <div className="flex-grow text-left ml-2">
              <span>•&nbsp;&nbsp;{activity.fee ? `  ${t('fee')} : ${activity.fee}` : `${t('noFee')}`}</span>
            </div>
          </div>
        </div>
      </div>
      {activity.cancel && (
        <div className="flex justify-end">
          <Button
            className="hover:bg-gray-900 active:bg-gray-800 rounded-md px-1"
            onClick={activity.cancel}
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

const ActivityItem = memo<ActivityItemProps>(({ className, fullHistory, activity, lastActivity }) => {
  const itemClassName = fullHistory ? 'text-black' : 'text-black';
  const style = lastActivity
    ? {}
    : {
        borderBottom: '1px solid #E9EBEF'
      };

  return (
    <div className={classNames('w-full', itemClassName, className)} style={style}>
      {activity.explorerLink ? (
        <a draggable={false} href={activity.explorerLink} target="_blank" rel="noreferrer">
          {ActivityContent({ className, fullHistory, activity })}
        </a>
      ) : (
        <>{ActivityContent({ className, fullHistory, activity })}</>
      )}
    </div>
  );
});

export default ActivityItem;

type TimeProps = {
  children: () => React.ReactElement;
};

const Time: React.FC<TimeProps> = ({ children }) => {
  const [value, setValue] = useState(children);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(children());
    }, 5_000);

    return () => {
      clearInterval(interval);
    };
  }, [setValue, children]);

  return value;
};

const addressTippyPropsMock = (content: string) => {
  return {
    trigger: 'mouseenter',
    hideOnClick: false,
    content: content,
    animation: 'shift-away-subtle',
    interactive: true
  };
};
