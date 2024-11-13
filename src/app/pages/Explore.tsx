import React, { FC, FunctionComponent, SVGProps, useEffect, useLayoutEffect, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';

import { ACTIVITY_SUMMARY_SIZE } from 'app/defaults';
import { openLoadingFullPage, useAppEnv } from 'app/env';
import { ReactComponent as ArrowLeftIcon } from 'app/icons/arrow-left.svg';
import { ReactComponent as FaucetIcon } from 'app/icons/faucet.svg';
import { ReactComponent as GlobalIcon } from 'app/icons/global-line.svg';
import { ReactComponent as LockIcon } from 'app/icons/lock.svg';
import { ReactComponent as ReceiveIcon } from 'app/icons/receive.svg';
import { ReactComponent as SendIcon } from 'app/icons/send.svg';
import { ReactComponent as StakeIcon } from 'app/icons/stake.svg';
import Footer from 'app/layouts/PageLayout/Footer';
import Header from 'app/layouts/PageLayout/Header';
import Activity from 'app/templates/activity/Activity';
import { AssetIcon } from 'app/templates/AssetIcon';
import { getChainStatus } from 'lib/miden-chain/client';
import { TOKEN_MAPPING, MidenTokens } from 'lib/miden-chain/constants';
import { getEstimatedSyncPercentage } from 'lib/miden/activity/sync/sync-plan';
import { ALEO_SLUG, ALEO_TOKEN_ID } from 'lib/miden/assets/constants';
import {
  useAccount,
  useAssetMetadata,
  useBalance,
  useFungibleTokens,
  useLocalStorage,
  useOwnMnemonic,
  useStakedBalance,
  useUnstakedBalance
} from 'lib/miden/front';
import { TestIDProps } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import { useAlert } from 'lib/ui/dialog';
import useTippy, { TippyProps } from 'lib/ui/useTippy';
import { HistoryAction, Link, navigate, To, useLocation } from 'lib/woozie';

import { ExploreSelectors } from './Explore.selectors';
import AddressChip from './Explore/AddressChip';
import EditableTitle from './Explore/EditableTitle';
import MainBanner from './Explore/MainBanner';
import SyncBanner from './Explore/SyncBanner';
import Tokens from './Explore/Tokens/Tokens';
import { useMidenClient } from 'app/hooks/useMidenClient';
import { useClaimableNotes } from 'lib/miden/front/claimable-notes';
import { useRetryableSWR } from 'lib/swr';
import { useQueuedTransactions } from 'lib/miden/front/queued-transactions';

const midenClient = await MidenClientInterface.create();

type ExploreProps = {
  assetSlug?: string | null;
  assetId?: string | null;
};

const tippyPropsMock = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('disabledForWatchOnlyAccount'),
  animation: 'shift-away-subtle'
};

const activityTippyPropsMock = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('activityToolTip'),
  animation: 'shift-away-subtle'
};

const Explore: FC<ExploreProps> = ({ assetSlug, assetId }) => {
  const account = useAccount();
  const { data: claimableNotes } = useClaimableNotes(account.publicKey);
  const { data: balance } = useBalance(account.id, TOKEN_MAPPING[MidenTokens.Miden].faucetId);
  if (assetId && !assetSlug) {
    if (!assetSlug) {
      // Tokens are not guaranteed to load on mount
      navigate('/', HistoryAction.Replace);
    }
  }

  const syncFraction = 1;

  const ownMnemonic = useOwnMnemonic();
  const address = account.publicKey;
  const { fullPage, registerBackHandler } = useAppEnv();
  const { search } = useLocation();
  const [hasSeenNotification, setHasSeenNotification] = useLocalStorage('chainStatus', { seen: false, timestamp: -1 });
  const alert = useAlert();
  const [queuedTransactions] = useQueuedTransactions();

  useEffect(() => {
    if (queuedTransactions.length) openLoadingFullPage();
  }, [queuedTransactions]);

  /* const fetchClaimableNotes = async () => {
    const notes = await midenClient.getCommittedNotes();
    if (notes.length === 0) {
      return;
    }
    setClaimableNotes(
      notes.map(note => ({
        id: note.id().to_string(),
        amount: note.details().assets().assets()[0].amount().toString()
      }))
    );
  };

  useEffect(() => {
    fetchClaimableNotes();
    const intervalId = setInterval(fetchClaimableNotes, 2000);
    return () => clearInterval(intervalId);
  }, []); */

  useLayoutEffect(() => {
    const usp = new URLSearchParams(search);
    if (assetId && usp.get('after_token_added') === 'true') {
      return registerBackHandler(() => {
        navigate('/', HistoryAction.Replace);
      });
    }
    return undefined;
  }, [registerBackHandler, assetId, search]);

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
        <>{syncFraction <= 0.995 && <SyncBanner syncText={formatSyncFraction(syncFraction)} fullPage={fullPage} />}</>
        {!assetId && <Header />}
        {/* {!assetId && <EditableTitle />} */}
        {assetId && (
          <div className="flex justify-start mt-1 py-4 mb-4 mx-4 text-lg uppercase font-medium">
            <div className="flex flex-col justify-center" style={{ lineHeight: '39px' }}>
              <Link testID={ExploreSelectors.ActivityTab} to={'/'} className="w-6 h-6">
                <ArrowLeftIcon />
              </Link>
            </div>
            <div className="flex ml-6" style={{ lineHeight: '39px' }}>
              <AssetIcon
                assetSlug={assetSlug!}
                assetId={assetId}
                size={assetSlug === ALEO_SLUG ? 18 : 34}
                className="mr-2 flex-shrink-0 rounded bg-white"
              />
              {assetSlug}
            </div>
          </div>
        )}
        <div className={classNames('flex flex-col justify-start mt-6')}>
          <div className="flex flex-col w-full justify-center items-center">
            <MainBanner balance={balance || new BigNumber(0)} />
            {!assetId && <AddressChip publicKey={account.publicKey} />}
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
            {/* <ActionButton
              label={<T id="faucet" />}
              Icon={FaucetIcon}
              to="/faucet"
              testID={ExploreSelectors.FaucetButton}
              className="w-1/2 mx-1"
              iconStyle={{ height: '20px', width: '20px', stroke: 'none' }}
            /> */}
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {/* <div className="mt-3 mx-4">
          <Alert
            variant={AlertVariant.Info}
            title={
              <>
                <span className="font-semibold">{t('dataReset')} </span>
                {t('transactionHistoryLost')}
                <a
                  href="https://help.leo.app/hc/en-us/articles/26854834718484-Important-Updates-for-the-New-Aleo-Testnet-Beta"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 text-blue-500"
                >
                  {t('learnMore')}
                </a>
              </>
            }
            canDismiss={false}
          />
        </div> */}
        {/* <SecondarySection assetSlug={assetSlug} assetId={assetId} /> */}
      </div>
      {/* {!assetId && (
        <div className="flex-none">
          <Footer />
        </div>
      )} */}
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

type SecondarySectionProps = {
  assetSlug?: string | null;
  assetId?: string | null;
  className?: string;
};

async function getSyncFraction(chainId: string, address: string, defaultSyncFraction: number): Promise<number> {
  return await getEstimatedSyncPercentage(chainId, address, defaultSyncFraction);
}

const formatSyncFraction = (syncFraction: number) => {
  return `${(100.0 * syncFraction).toFixed(1)}%`;
};

const SecondarySection: FC<SecondarySectionProps> = ({ className, assetSlug, assetId }) => {
  const account = useAccount();

  const activityRef = useTippy<HTMLSpanElement>(activityTippyPropsMock);
  const assetMetadata = useAssetMetadata(assetSlug ?? ALEO_SLUG, assetId ?? ALEO_TOKEN_ID);
  let programId = assetId ? assetMetadata?.programId : undefined;
  const activityLink = assetId ? `/activity/${programId}` : '/activity';

  return (
    <div className={classNames('bg-transparent', 'rounded-lg', className)}>
      {!assetId && (
        <div className={classNames('w-full px-4 pt-3', 'flex justify-start', 'text-sm font-semibold text-black')}>
          <span>{t('tokens')}</span>
        </div>
      )}

      {!assetId && (
        <div className={'mx-4 pb-2'}>
          <Tokens />
        </div>
      )}

      {/* {assetSlug && assetSlug == ALEO_SLUG && <StakeBalance />} */}

      {assetId && <PublicPrivateBalance assetSlug={assetSlug!} assetId={assetId} />}

      {assetId && (
        <div
          className={classNames('w-full', 'flex justify-start', 'text-sm text-black', 'cursor-pointer', 'px-4 pt-2')}
        >
          <span ref={activityRef}>
            <Link testID={ExploreSelectors.ActivityTab} to={activityLink}>
              <span className="font-semibold pr-2">{t('activity')}</span>
            </Link>
          </span>
        </div>
      )}

      {assetId && <Activity address={account.publicKey} programId={programId} numItems={ACTIVITY_SUMMARY_SIZE} />}
    </div>
  );
};

type PublicPrivateBalanceProps = {
  assetSlug: string;
  assetId: string;
};

const PublicPrivateBalance: FC<PublicPrivateBalanceProps> = ({ assetSlug, assetId }) => {
  const account = useAccount();
  const { data: balance } = useBalance('0x92d3323052c31ffd', TOKEN_MAPPING[MidenTokens.Miden].faucetId);

  const convertUrl = assetSlug === ALEO_SLUG ? '/convert-visibility/aleo' : `/convert-visibility/${assetId}`;

  return (
    <>
      <div className="flex w-full p-4 my-2">
        <div className="flex w-1/2 justify-center">
          <div
            className="flex flex-col justify-center rounded-full"
            style={{ height: '40px', width: '40px', background: '#F3F3F3' }}
          >
            <LockIcon className="m-auto" />
          </div>
          <div className="flex flex-col ml-2">
            <span className="text-xs" style={{ color: '#484848' }}>
              {t('private')}
            </span>
            {/* TODO: */}
            <span className="text-sm font-medium">{balance?.toString() || 0.0}</span>
          </div>
        </div>
        <div className="flex w-1/2 justify-center">
          <div
            className="flex flex-col justify-center rounded-full"
            style={{ height: '40px', width: '40px', background: '#F3F3F3' }}
          >
            <GlobalIcon className="m-auto" />
          </div>
          <div className="flex flex-col ml-2">
            <span className="text-xs" style={{ color: '#484848' }}>
              {t('public')}
            </span>
            <span className="text-sm font-medium">{0.0}</span>
          </div>
        </div>
      </div>
      <div className="flex w-full justify-center text-xs hover:underline" style={{ color: '#3872D4' }}></div>
    </>
  );
};

type StakeBalanceProps = {
  assetSlug?: string;
  assetId?: string;
};

const StakeBalance: FC<StakeBalanceProps> = ({ assetSlug = ALEO_SLUG, assetId = ALEO_TOKEN_ID }) => {
  const account = useAccount();

  return (
    <div className="w-full flex px-4 py-4 m-auto">
      <Link testID={ExploreSelectors.StakeButton} to={'leo.app'} className="w-full">
        <div className="w-full flex flex-row px-4 rounded-lg py-4 bg-purple-100 hover:bg-purple-200 transition-colors duration-500 ease-in-out cursor-pointer">
          <div className="py-1 flex flex-col justify-center self-center h-8 w-8 rounded-full bg-purple-950">
            <StakeIcon
              style={{
                margin: 'auto',
                height: '16px',
                width: '16px'
              }}
            />
          </div>
          <div className="flex flex-row ml-2 flex-grow items-center">
            <div className="flex flex-col">
              <span className="text-purple-950 text-sm">{'stakeCTA'}</span>
              {<span className="text-gray-250 text-xs">{t('stakeEarnRewards')}</span>}
            </div>
            {
              <div className="flex flex-col flex-grow items-end">
                <span className="text-black text-sm font-semibold">
                  {'stakedAleoBalance!.toNumber()'} {assetSlug.toUpperCase()}
                </span>
                <span className="text-gray-250 text-xs">
                  +{'stakedRewards!.toNumber()'} {assetSlug.toUpperCase()}
                </span>
              </div>
            }
            {
              <div className="flex flex-col flex-grow items-end">
                <span className="text-black text-sm font-semibold">
                  {'unstakedBalance!.balance.toNumber()'} {assetSlug.toUpperCase()}
                </span>
              </div>
            }
          </div>
        </div>
      </Link>
    </div>
  );
};
