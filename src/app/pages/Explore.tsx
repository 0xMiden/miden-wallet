import React, { FC, FunctionComponent, SVGProps, useEffect, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { openLoadingFullPage, useAppEnv } from 'app/env';
import { ReactComponent as ReceiveIcon } from 'app/icons/receive.svg';
import { ReactComponent as SendIcon } from 'app/icons/send.svg';
import { Icon, IconName } from 'app/icons/v2';
import Footer from 'app/layouts/PageLayout/Footer';
import Header from 'app/layouts/PageLayout/Header';
import { Avatar } from 'components/Avatar';
import { CardItem } from 'components/CardItem';
import { TestIDProps } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import { hasQueuedTransactions } from 'lib/miden/activity';
import {
  getFaucetIdSetting,
  getTokenId,
  isMidenFaucet,
  TokenBalance,
  useAccount,
  useFungibleTokens
} from 'lib/miden/front';
import { useClaimableNotes } from 'lib/miden/front/claimable-notes';
import { useRetryableSWR } from 'lib/swr';
import useTippy, { TippyProps } from 'lib/ui/useTippy';
import { Link, To } from 'lib/woozie';
import { shortenAddress } from 'utils/string';

import { ExploreSelectors } from './Explore.selectors';
import AddressChip from './Explore/AddressChip';
import MainBanner from './Explore/MainBanner';

const tippyPropsMock = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('disabledForWatchOnlyAccount'),
  animation: 'shift-away-subtle'
};

const Explore: FC = () => {
  const account = useAccount();
  const { data: claimableNotes } = useClaimableNotes(account.publicKey);
  const { data: balanceData } = useFungibleTokens(account.publicKey);
  const { tokens, totalBalance } = balanceData || { tokens: [], totalBalance: new BigNumber(0) };

  const address = account.publicKey;
  const { fullPage } = useAppEnv();

  const { data: queuedDbTransactions } = useRetryableSWR(
    [`has-queued-transactions`, address],
    async () => hasQueuedTransactions(),
    {
      revalidateOnMount: true,
      refreshInterval: 15_000,
      dedupingInterval: 5_000
    }
  );

  useEffect(() => {
    if (queuedDbTransactions) openLoadingFullPage();
  }, [queuedDbTransactions]);

  const size = fullPage ? { height: '640px', width: '600px' } : { height: '600px', width: '360px' };

  return (
    <div
      className={classNames(
        'flex flex-col m-auto',
        'bg-gradient-to-br from-purple-200 via-white to-white',
        fullPage && 'rounded-3xl'
      )}
      style={size}
    >
      <div className="flex-none">
        <Header />
        <div className={classNames('flex flex-col justify-start mt-6')}>
          <div className="flex flex-col w-full justify-center items-center">
            <MainBanner />
            <AddressChip publicKey={account.publicKey} />
          </div>
          <div className="flex justify-between items-center w-full mt-1 px-2 mb-4">
            <ActionButton
              label={<T id="send" />}
              Icon={SendIcon}
              to={'/send'}
              disabled={false}
              tippyProps={tippyPropsMock}
              testID={ExploreSelectors.SendButton}
              className="w-1/2 mx-1"
            />
            <div className="flex-1 relative">
              <ActionButton
                label={<T id="receive" />}
                Icon={ReceiveIcon}
                to="/receive"
                testID={ExploreSelectors.ReceiveButton}
                className="w-1/2 mx-1"
              />
              {claimableNotes !== undefined && claimableNotes.length > 0 && (
                <div className="absolute top-[20%] left-[60%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {claimableNotes.length}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto relative">
        <div className={classNames('bg-transparent', 'md:w-[460px] md:mx-auto px-4')}>
          <div className={classNames('w-full pt-3 mb-2', 'flex justify-start', 'text-sm font-semibold text-black')}>
            {totalBalance.isGreaterThan(0) && <span>{t('tokens')}</span>}
          </div>
          <div className="flex-1 flex flex-col pb-4 space-y-2">
            {tokens.length > 0 &&
              tokens
                .sort(a => (isMidenFaucet(a.faucetId) ? -1 : 1))
                .map((token: TokenBalance) => {
                  const tokenId = getTokenId(token.faucetId);
                  const isMiden = tokenId === 'MIDEN';
                  return (
                    <div key={token.faucetId} className="flex">
                      <CardItem
                        iconLeft={
                          <Avatar size="lg" image={isMiden ? '/misc/miden.png' : '/misc/token-logos/default.svg'} />
                        }
                        title={tokenId}
                        subtitle={shortenAddress(token.faucetId, 13, 7)}
                        titleRight={`$${token.balance.toFixed(2)}`}
                        subtitleRight={token.balance.toString()}
                        className="flex-1 border border-grey-50 rounded-lg "
                      />
                    </div>
                  );
                })}
            {tokens.length === 0 && (
              <div className="flex">
                <CardItem
                  iconLeft={<Avatar size="lg" image="/misc/miden.png" />}
                  title="MIDEN"
                  subtitle={shortenAddress(getFaucetIdSetting(), 13, 7)}
                  titleRight="$0.00"
                  subtitleRight="0"
                  className="flex-1 border border-grey-50 rounded-lg "
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-none">
        <Footer />
      </div>
    </div>
  );
};

export default Explore;

interface ActionButtonProps extends TestIDProps {
  label: React.ReactNode;
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  to: To;
  disabled?: boolean;
  tippyProps?: Partial<TippyProps>;
  className?: string;
  iconStyle?: React.CSSProperties;
}

const ActionButton: FC<ActionButtonProps> = ({
  label,
  Icon,
  to,
  disabled,
  tippyProps = {},
  testID,
  testIDProperties,
  className,
  iconStyle
}) => {
  const spanRef = useTippy<HTMLSpanElement>(tippyProps);
  const commonButtonProps = useMemo(
    () => ({
      className: `flex flex-col items-center`,
      type: 'button' as const,
      children: (
        <>
          <div className={classNames('mb-1 flex flex-col items-center', 'rounded-lg', 'pt-1')}>
            <div
              className="py-1 flex flex-col justify-center bg-primary-500 hover:bg-primary-600"
              style={{
                height: '48px',
                width: '48px',
                borderRadius: '24px'
              }}
            >
              <Icon
                style={{
                  margin: 'auto',
                  height: '12px',
                  width: '12px',
                  stroke: `${disabled ? '#CBD5E0' : '#FFF'}`,
                  ...iconStyle
                }}
              />
            </div>
            <span
              className={classNames('text-xs text-center', disabled ? 'text-gray-400' : 'text-black', 'py-1')}
              style={{
                fontSize: '12px',
                lineHeight: '16px'
              }}
            >
              {label}
            </span>
          </div>
        </>
      )
    }),
    [disabled, Icon, label, iconStyle]
  );
  return disabled ? (
    <span {...commonButtonProps} className={className} ref={spanRef}></span>
  ) : (
    <Link testID={testID} testIDProperties={testIDProperties} to={to} {...commonButtonProps} className={className} />
  );
};
