import React, { useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { AmountLabel } from 'components/AmountLabel';
import { Avatar } from 'components/Avatar';
import { Button, ButtonVariant } from 'components/Button';
import { CardItem } from 'components/CardItem';
import { CircleButton } from 'components/CircleButton';
import { SquareButton } from 'components/SquareButton';
import { ConnectivityIssueBanner } from 'components/ConnectivityIssueBanner';
import { TabBar } from 'components/TabBar';
import colors from 'utils/tailwind-colors';

export enum Action {
  Send = 'send',
  Receive = 'receive',
  Faucet = 'faucet',
  EditAccounts = 'edit-accounts',
  CopyAddress = 'copy-address',
  SwitchAccount = 'switch-account',
  SwitchNetwork = 'switch-network',
  OpenFullScreen = 'open-full-screen',
  OpenTokenDetails = 'open-token-details'
}

export interface HomeScreenProps {
  className?: string;
  syncing?: boolean;
  syncProgress?: number;
  isFullScreen?: boolean;
  networkName?: string;
  accountName?: string;
  accountAddress?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  className,
  syncing,
  syncProgress,
  accountAddress,
  accountName,
  isFullScreen,
  networkName
}) => {
  const { t } = useTranslation();
  const [tabs, setTabs] = useState([
    { active: true, icon: IconName.Home, activeIcon: IconName.HomeFill },
    { active: false, icon: IconName.List },
    { active: false, icon: IconName.Image },
    { active: false, icon: IconName.Settings }
  ]);

  const onTabChange = (index: number) => {
    setTabs(prevTabs =>
      prevTabs.map((tab, i) => ({
        ...tab,
        active: i === index
      }))
    );
  };
  //
  return (
    <div className={classNames('flex-1 flex flex-col bg-white max-w-[600px] h-full', className)}>
      {/* Sync Banner */}
      {syncing && (
        <ConnectivityIssueBanner className="" progress={syncProgress ?? 0} isFullScreen={isFullScreen} onClick={() => {}} />
      )}
      <div className="relative flex-1 bg-[url('/public/misc/bg.svg')] bg-top bg-no-repeat  flex flex-col overflow-hidden">
        <header className="absolute right-[1rem] left-0 top-0 left-8 flex flex-col backdrop-blur-lg z-20">
          {/* Header */}
          <div className={classNames('flex items-center justify-between p-4 ')}>
            <Button
              title={accountName}
              className="!px-0 !py-0 hover:!bg-transparent"
              variant={ButtonVariant.Ghost}
              iconLeft={<Avatar size="md" color={colors.blue[500]} image={'/misc/logo.png'} />}
              iconRight={<Icon name={IconName.ChevronDown} size="sm" fill="black" />}
            />
            <div className="flex gap-x-2 items-center">
              <Button variant={ButtonVariant.Ghost} className="!px-2 !py-1 !rounded-full border border-grey-200">
                <div className="bg-green-500 w-2 h-2 rounded-full" />
                <p className="text-xs">{networkName}</p>
              </Button>
              <SquareButton icon={IconName.Fullscreen} />
            </div>
          </div>
        </header>

        <article className="flex-1 flex justify-center overflow-hidden z-10 overflow-y-auto pt-20">
          <div className="flex-1 flex flex-col max-w-[460px] ">
            {/* Account Switcher */}
            <div className={classNames('flex')}>
              <button className="flex items-center gap-x-2">
                <p className="font-normal">{accountName}</p>
                <Icon name={IconName.Pencil} size="xs" fill="black" />
              </button>
            </div>

            {/* Amount Label */}
            <div className={classNames('flex')}>
              <AmountLabel amount={'500'} currency="$" />
            </div>

            {/* Wallet shortened address */}
            <div className={classNames('flex mt-2')}>
              <button className="flex items-center gap-x-2">
                <p className="font-normal">{accountAddress}</p>
                <Icon name={IconName.FileCopy} size="xs" fill="black" />
              </button>
            </div>

            {/* A row of circle buttons */}
            <div className={classNames('flex justify-between mt-4')}>
              <CircleButton icon={IconName.ArrowRightUp} title={t('send')} />
              <CircleButton icon={IconName.ArrowRightDown} title={t('receive')} />
              <CircleButton icon={IconName.Faucet} title={t('faucet')} />
            </div>

            {/* List of ListItem tokens with a header "Tokens" */}
            <div className={classNames('flex flex-1 flex-col mt-10 gap-y-2')}>
              <h5 className="text-lg font-medium text-black">{t('tokens')}</h5>
              <div className="flex-1 pb-4 space-y-2">
                <CardItem
                  iconLeft="wallet"
                  subtitleRight="~ $500.00"
                  title="Aleo"
                  titleRight="20.00"
                  className="border border-grey-50 rounded-lg "
                />
                <CardItem
                  iconLeft="wallet"
                  subtitleRight="~ $500.00"
                  title="Aleo"
                  titleRight="20.00"
                  className="border border-grey-50 rounded-lg "
                />
                <CardItem
                  iconLeft="wallet"
                  subtitleRight="~ $500.00"
                  title="Aleo"
                  titleRight="20.00"
                  className="border border-grey-50 rounded-lg "
                />
                <CardItem
                  iconLeft="wallet"
                  subtitleRight="~ $500.00"
                  title="Aleo"
                  titleRight="20.00"
                  className="border border-grey-50 rounded-lg "
                />
                <CardItem
                  iconLeft="wallet"
                  subtitleRight="~ $500.00"
                  title="Aleo"
                  titleRight="20.00"
                  className="border border-grey-50 rounded-lg "
                />
                <CardItem
                  iconLeft="wallet"
                  subtitleRight="~ $500.00"
                  title="Aleo"
                  titleRight="20.00"
                  className="border border-grey-50 rounded-lg "
                />
                <CardItem
                  iconLeft="wallet"
                  subtitleRight="~ $500.00"
                  title="Aleo"
                  titleRight="20.00"
                  className="border border-grey-50 rounded-lg "
                />
                <CardItem
                  iconLeft="wallet"
                  subtitleRight="~ $500.00"
                  title="Aleo"
                  titleRight="20.00"
                  className="border border-grey-50 rounded-lg "
                />
              </div>
            </div>
          </div>
        </article>

        {/* Tab Bar */}
        <footer className={classNames('absolute left-0 right-[10px] bottom-0 flex z-10')}>
          <TabBar tabs={tabs} onTabChange={onTabChange} />
        </footer>
      </div>
    </div>
  );
};
