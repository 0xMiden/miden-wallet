import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';

import constate from 'constate';

import { usePassiveStorage, useMidenClient } from 'lib/miden/front';
import { MidenState } from '../types';
import { WalletStatus } from 'lib/shared/types';

export enum ActivationStatus {
  ActivationRequestSent,
  AlreadyActivated
}

export const [
  ReadyAleoProvider,
  useAllNetworks,
  useSetNetworkId,
  useNetwork,
  useAllAccounts,
  useAccount,
  useSettings,
  useOwnMnemonic
] = constate(
  useReadyMiden,
  v => v.allNetworks,
  v => v.setNetworkId,
  v => v.network,
  v => v.allAccounts,
  v => v.account,
  v => v.settings,
  v => v.ownMnemonic
);

function useReadyMiden() {
  const midenFront = useMidenClient();
  assertReady(midenFront);

  const { networks: allNetworks, accounts: allAccounts, settings, currentAccount: account, ownMnemonic } = midenFront;
  const accountPk = account;

  /**
   * Networks
   */

  const defaultNet = allNetworks[0];
  const [networkId, setNetworkId] = usePassiveStorage('network_id', defaultNet.id);

  useEffect(() => {
    if (allNetworks.every(a => a.id !== networkId)) {
      setNetworkId(defaultNet.id);
    }
  }, [allNetworks, networkId, setNetworkId, defaultNet]);

  const network = useMemo(
    () => allNetworks.find(n => n.id === networkId) ?? defaultNet,
    [allNetworks, networkId, defaultNet]
  );

  // /**
  //  * Accounts
  //  */
  // const defaultAcc = allAccounts[0];
  // const [accountPk, setAccountPk] = usePassiveStorage('account_publickey', defaultAcc.publicKey);

  // useEffect(() => {
  //   if (allAccounts.every(a => a.publicKey !== accountPk)) {
  //     setAccountPk(defaultAcc.publicKey);
  //   }
  // }, [allAccounts, accountPk, setAccountPk, defaultAcc]);

  // const account = useMemo(
  //   () => allAccounts.find(a => a.publicKey === accountPk) ?? defaultAcc,
  //   [allAccounts, accountPk, defaultAcc]
  // );

  /**
   * Error boundary reset
   */

  useLayoutEffect(() => {
    const evt = new CustomEvent('reseterrorboundary');
    window.dispatchEvent(evt);
  }, [networkId, accountPk]);

  return {
    allNetworks,
    network,
    networkId,
    setNetworkId,
    allAccounts,
    account,
    accountPk,
    settings,
    ownMnemonic
  };
}

function assertReady(state: MidenState) {
  if (state.status !== WalletStatus.Ready) {
    throw new Error('Aleo not ready');
  }
}
