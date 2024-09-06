import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';

import constate from 'constate';

import { usePassiveStorage, useAleoClient } from 'lib/aleo/front';

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
  useReadyAleo,
  v => v.allNetworks,
  v => v.setNetworkId,
  v => v.network,
  v => v.allAccounts,
  v => v.account,
  v => v.settings,
  v => v.ownMnemonic
);

function useReadyAleo() {
  const aleoFront = useAleoClient();
  assertReady();

  const { settings, ownMnemonic } = aleoFront;
  const accountPk = 'publicKey';

  /**
   * Networks
   */

  const defaultNet = 'defaultNet';
  const allNetworks = [defaultNet];
  const [networkId, setNetworkId] = usePassiveStorage('network_id', 'defaultNet');

  const network = defaultNet;
  const account = { publicKey: accountPk, name: 'account name' };

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
    allAccounts: [account],
    account,
    accountPk,
    settings,
    ownMnemonic
  };
}

function assertReady() {}
