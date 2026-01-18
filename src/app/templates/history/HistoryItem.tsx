import React, { FC, memo, useCallback } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import AddressShortView from 'app/atoms/AddressShortView';
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
import { isMobile } from 'lib/platform';
import { Link } from 'lib/woozie';

import { HistoryEntryType, IHistoryEntry } from './IHistoryEntry';

type HistoryItemProps = {
  entry: IHistoryEntry;
  fullHistory?: boolean;
  className?: string;
  lastEntry?: boolean;
};

const iconGrabber = (entryType: HistoryEntryType, iconFillAndStroke: string) => {
  switch (entryType) {
    case HistoryEntryType.PendingTransaction:
    case HistoryEntryType.ProcessingTransaction:
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

const HistoryContent: FC<HistoryItemProps> = ({ fullHistory, entry }) => {
  const { t } = useTranslation();
  const iconFillAndStroke = fullHistory ? 'currentColor' : 'black';
  const icon = !entry.transactionIcon
    ? iconGrabber(entry.type, iconFillAndStroke)
    : transactionIconGrabber(entry.transactionIcon, iconFillAndStroke);
  const animateSpin = entry.type === HistoryEntryType.ProcessingTransaction ? 'animate-spin' : '';
  const isReceive = entry.transactionIcon === 'RECEIVE' || entry.message === 'Consuming';
  const { popup } = useAppEnv();

  const handleCancelClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      entry.cancel?.();
    },
    [entry]
  );

  return (
    <div className="w-full flex px-4 md:px-6 m-auto py-3 gap-x-2 md:gap-x-4 hover:bg-gray-800 focus:bg-gray-800 transition-colors duration-500 ease-in-out cursor-pointer overflow-hidden">
      <div
        className={`flex items-center flex-shrink-0 ${animateSpin}`}
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

      <div className="flex items-center flex-grow min-w-0">
        <div className="flex flex-col flex-grow min-w-0">
          <div className="text-sm font-medium truncate">
            <span>{entry.message}</span>
          </div>

          <div className="text-xs text-gray-600 truncate">
            {entry.secondaryAddress && (
              <>
                {`${isReceive ? t('from') : t('to')} `}
                <AddressShortView address={entry.secondaryAddress} trim={isMobile() || popup} />
              </>
            )}
          </div>
        </div>
      </div>
      {entry.amount && (
        <div className="flex items-center flex-col justify-end flex-shrink-0">
          <div className={`text-sm self-end font-medium whitespace-nowrap ${isReceive ? 'text-green-500' : ''}`}>
            {entry.amount}
          </div>
          {entry.token && (
            <div>
              <span className="text-gray-600">
                <HashShortView hash={entry.token} />
              </span>
            </div>
          )}
        </div>
      )}
      {entry.cancel && (
        <div className="flex justify-end flex-shrink-0">
          <Button
            className="hover:bg-gray-900 active:bg-gray-800 rounded-md px-1"
            onClick={handleCancelClick}
            testID={ExploreSelectors.CancelTransaction}
          >
            <CloseIcon stroke={iconFillAndStroke} height={'24px'} width={'24px'} />
          </Button>
        </div>
      )}
      {entry.explorerLink && (
        <div className="flex items-center justify-end rounded-md flex-shrink-0">
          <ExploreIcon stroke={'black'} height={'18px'} width={'18px'} />
        </div>
      )}
    </div>
  );
};

const HistoryItem = memo<HistoryItemProps>(({ className, fullHistory, entry }) => {
  const itemClassName = fullHistory ? 'text-black' : 'text-black';

  return (
    <div className={classNames('w-full', itemClassName, className)}>
      {entry.explorerLink ? (
        <a draggable={false} href={entry.explorerLink} target="_blank" rel="noreferrer">
          {HistoryContent({ className, fullHistory, entry })}
        </a>
      ) : (
        <Link to={`/history-details/${entry.txId}`}>{HistoryContent({ className, fullHistory, entry })}</Link>
      )}
    </div>
  );
});

export default HistoryItem;
