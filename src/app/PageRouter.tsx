import React, { FC, useLayoutEffect, useMemo } from 'react';

import { OpenInFullPage, useAppEnv } from 'app/env';
import CreateAccount from 'app/pages/CreateAccount';
import Explore from 'app/pages/Explore';
import Faucet from 'app/pages/Faucet';
import ImportAccount from 'app/pages/ImportAccount';
import { CreateWallet } from 'app/pages/NewWallet/CreateWallet';
import { ImportWallet } from 'app/pages/NewWallet/ImportWallet';
import { Receive } from 'app/pages/Receive';
import SendNFT from 'app/pages/SendNFT';
import Settings from 'app/pages/Settings';
import Unlock from 'app/pages/Unlock';
import Welcome from 'app/pages/Welcome';
import { useMidenContext } from 'lib/miden/front';
import * as Woozie from 'lib/woozie';
import { GeneratingTransactionPage } from 'screens/generating-transaction/GeneratingTransaction';
import { SendFlow } from 'screens/send-flow/SendManager';

import RootSuspenseFallback from './a11y/RootSuspenseFallback';
import AllActivity from './pages/AllActivity';
import ClaimUnstaked from './pages/ClaimUnstaked';
import ConvertVisibility from './pages/ConvertVisibility';
import EditAccountName from './pages/EditAccountName';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ForgotPasswordInfo from './pages/ForgotPassword/ForgotPasswordInfo';
import { GetTokens } from './pages/GetTokens';
import ImportNotePending from './pages/ImportNotePending';
import ImportNoteResult from './pages/ImportNoteResult';
import ManageAssets from './pages/ManageAssets';
import ResetRequired from './pages/ResetRequired';
import SelectAccount from './pages/SelectAccount';
import Stake from './pages/Stake';
import StakeDetails from './pages/StakeDetails';
import Unstake from './pages/Unstake';
import { ActivityDetails } from './templates/activity/ActivityDetails';

interface RouteContext {
  popup: boolean;
  fullPage: boolean;
  ready: boolean;
  locked: boolean;
}

type RouteFactory = Woozie.Router.ResolveResult<RouteContext>;

const ROUTE_MAP = Woozie.Router.createMap<RouteContext>([
  [
    '/import-wallet/:tabSlug?',
    (p, ctx) => {
      switch (true) {
        case ctx.ready:
          return Woozie.Router.SKIP;

        case !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return <ImportWallet key={p.tabSlug ?? ''} tabSlug={p.tabSlug ?? undefined} />;
      }
    }
  ],
  ['/reset-required', () => <ResetRequired />],
  [
    '/reset-wallet',
    (_p, ctx) => {
      switch (true) {
        case !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return <ForgotPassword />;
      }
    }
  ],
  ['/forgot-password-info', () => <ForgotPasswordInfo />],
  [
    '/forgot-password',
    (_p, ctx) => {
      switch (true) {
        case ctx.ready:
          return Woozie.Router.SKIP;

        case !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return <ForgotPassword />;
      }
    }
  ],
  [
    '*',
    (_p, ctx) => {
      switch (true) {
        case ctx.locked:
          return <Unlock />;

        case !ctx.ready && !ctx.fullPage:
          return <OpenInFullPage />;

        default:
          return Woozie.Router.SKIP;
      }
    }
  ],
  ['/loading', (_p, ctx) => (ctx.ready ? <Woozie.Redirect to={'/'} /> : <RootSuspenseFallback />)],
  ['/', (_p, ctx) => (ctx.ready ? <Explore /> : <Welcome />)],
  ['/create-wallet', onlyNotReady(() => <CreateWallet />)],
  ['/select-account', onlyReady(() => <SelectAccount />)],
  ['/create-account', onlyReady(() => <CreateAccount />)],
  ['/edit-name', onlyReady(() => <EditAccountName />)],
  ['/import-account/:tabSlug?', onlyReady(({ tabSlug }) => <ImportAccount tabSlug={tabSlug} />)],
  ['/receive', onlyReady(() => <Receive />)],
  ['/faucet', onlyReady(() => <Faucet />)],
  ['/get-tokens', onlyReady(() => <GetTokens />)],
  ['/activity/:programId?', onlyReady(({ programId }) => <AllActivity programId={programId} />)],
  [
    '/activity-details/:transactionId',
    onlyReady(({ transactionId }) => <ActivityDetails transactionId={transactionId!} />)
  ],
  ['/manage-assets/:assetType?', onlyReady(({ assetType }) => <ManageAssets assetType={assetType!} />)],
  ['/send', onlyReady(() => <SendFlow isLoading={false} />)],
  ['/send-nft', onlyReady(() => <SendNFT />)],
  ['/convert-visibility/aleo', onlyReady(() => <ConvertVisibility assetSlug="aleo" assetId={'defaultaleotokenid'} />)],
  ['/convert-visibility/:assetId', onlyReady(({ assetId }) => <ConvertVisibility assetId={assetId!} />)],
  ['/settings/:tabSlug?', onlyReady(({ tabSlug }) => <Settings tabSlug={tabSlug} />)],
  ['/generating-transaction', onlyReady(() => <GeneratingTransactionPage />)],
  ['/generating-transaction-full', onlyReady(() => <GeneratingTransactionPage keepOpen={true} />)],
  ['/stake', onlyReady(() => <Stake />)],
  ['/unstake', onlyReady(() => <Unstake />)],
  ['/stake-details', onlyReady(() => <StakeDetails />)],
  ['/claim', onlyReady(() => <ClaimUnstaked />)],
  ['/import-note-pending/:noteId', onlyReady(({ noteId }) => <ImportNotePending noteId={noteId!} />)],
  ['/import-note-success', onlyReady(() => <ImportNoteResult success={true} />)],
  ['/import-note-failure', onlyReady(() => <ImportNoteResult success={false} />)],
  ['*', () => <Woozie.Redirect to="/" />]
]);

const PageRouter: FC = () => {
  const { trigger, pathname } = Woozie.useLocation();

  // Scroll to top after new location pushed.
  useLayoutEffect(() => {
    if (trigger === Woozie.HistoryAction.Push) {
      window.scrollTo(0, 0);
    }

    if (pathname === '/') {
      Woozie.resetHistoryPosition();
    }
  }, [trigger, pathname]);

  const appEnv = useAppEnv();
  const miden = useMidenContext();

  const ctx = useMemo<RouteContext>(
    () => ({
      popup: appEnv.popup,
      fullPage: appEnv.fullPage,
      ready: miden.ready,
      locked: miden.locked
    }),
    [appEnv.popup, appEnv.fullPage, miden]
  );

  return useMemo(() => Woozie.Router.resolve(ROUTE_MAP, pathname, ctx), [pathname, ctx]);
};

export default PageRouter;

function onlyReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (ctx.ready ? factory(params, ctx) : Woozie.Router.SKIP);
}

function onlyNotReady(factory: RouteFactory): RouteFactory {
  return (params, ctx) => (ctx.ready ? Woozie.Router.SKIP : factory(params, ctx));
}
