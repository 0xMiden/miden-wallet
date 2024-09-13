import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import constate from 'constate';

import { IntercomClient } from 'lib/intercom';
import { useRetryableSWR } from 'lib/swr';
import { retryWithTimeout } from 'lib/utility/retry';

import { AutoSync } from './autoSync';
import {
  WalletMessageType,
  WalletNotification,
  WalletRequest,
  WalletResponse,
  WalletState,
  WalletStatus
} from 'lib/shared/types';
import { MidenState } from '../types';

export type ChainApiStatus = 'up' | 'warning' | 'down' | 'unknown';

type Confirmation = {
  id: string;
  error?: any;
};

let intercom: IntercomClient | null;
function getIntercom() {
  if (!intercom) {
    intercom = new IntercomClient();
  }
  return intercom;
}

// TODO: Make generalizable with WalletState (?)
// Might need to get several state fetchers
async function fetchStateAsync(maxRetries: number = 0): Promise<MidenState> {
  const res = await retryWithTimeout(
    async () => {
      const res = await request({ type: WalletMessageType.GetStateRequest });
      assertResponse(res.type === WalletMessageType.GetStateResponse);
      return res;
    },
    3_000,
    maxRetries
  );

  return res.state;
}

export const [MidenClientProvider, useMidenClient] = constate(() => {
  /**
   * State
   */
  const fetchState = useCallback(async () => fetchStateAsync(5), []);

  const { data, mutate } = useRetryableSWR('state', fetchState, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  const state = data!;
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [chainStatus, setChainStatus] = useState<ChainApiStatus>('unknown');
  const confirmationIdRef = useRef<string | null>(null);
  const resetConfirmation = useCallback(() => {
    confirmationIdRef.current = null;
    setConfirmation(null);
  }, [setConfirmation]);

  useEffect(() => {
    return getIntercom().subscribe((msg: WalletNotification) => {
      switch (msg?.type) {
        case WalletMessageType.StateUpdated:
          mutate();
          break;
      }
    });
  }, [mutate, setConfirmation, resetConfirmation]);

  useEffect(() => {
    AutoSync.updateState();
  }, [state]);

  useEffect(() => {
    const fetchChainStatus = async () => {
      try {
        // TODO: Change what our health check endpoint is
        const response = await fetch('https://testnetbeta.aleorpc.com/blockHeightIsCurrent');
        setChainStatus(response.ok ? 'up' : 'down');
      } catch (error) {
        console.log('Failed to get status:', error);
      }
    };

    const statusInterval = setInterval(fetchChainStatus, 5 * 1000);

    fetchChainStatus();

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  /**
   * Aliases
   */
  const { status, networks: defaultNetworks, accounts, settings, currentAccount, ownMnemonic } = state;
  const idle = status === WalletStatus.Idle;
  const locked = status === WalletStatus.Locked;
  const ready = status === WalletStatus.Ready;

  const networks = useMemo(() => [...defaultNetworks], [defaultNetworks]);

  /*
  Actions
  */
  // TODO: Make this take some sort of enum for multi wallet support
  const registerWallet = useCallback(async (password: string, mnemonic?: string, ownMnemonic?: boolean) => {
    const res = await request({
      type: WalletMessageType.NewWalletRequest,
      password,
      mnemonic,
      ownMnemonic
    });
    assertResponse(res.type === WalletMessageType.NewWalletResponse);
  }, []);

  const unlock = useCallback(async (password: string) => {
    const res = await request({
      type: WalletMessageType.UnlockRequest,
      password
    });
    assertResponse(res.type === WalletMessageType.UnlockResponse);
  }, []);

  const createAccount = useCallback(async (name?: string) => {}, []);

  const updateCurrentAccount = useCallback(async (accountPublicKey: string) => {}, []);

  const decryptCiphertexts = useCallback(async (accPublicKey: string, ciphertexts: string[]) => {}, []);

  const revealViewKey = useCallback(async (accountPublicKey: string, password: string) => {}, []);

  const revealPrivateKey = useCallback(async (accountPublicKey: string, password: string) => {}, []);

  const revealMnemonic = useCallback(async (password: string) => {}, []);

  const removeAccount = useCallback(async (accountPublicKey: string, password: string) => {}, []);

  const editAccountName = useCallback(async (accountPublicKey: string, name: string) => {
    console.log('miden/front/client.ts editAccountName');
    const res = await request({
      type: WalletMessageType.EditAccountRequest,
      accountPublicKey,
      name
    });
    assertResponse(res.type === WalletMessageType.EditAccountResponse);
  }, []);

  const importAccount = useCallback(async (privateKey: string, encPassword?: string) => {}, []);

  const importWatchOnlyAccount = useCallback(async (viewKey: string) => {}, []);

  const importMnemonicAccount = useCallback(async (mnemonic: string, password?: string, derivationPath?: string) => {},
  []);

  const updateSettings = useCallback(async () => {}, []);

  const authorizeTransaction = useCallback(
    async (
      accPublicKey: string,
      program: string,
      functionName: string,
      inputs: string[],
      feeCredits: number,
      feeRecord?: string,
      imports?: { [key: string]: string }
    ) => {},
    []
  );

  const authorizeDeploy = useCallback(
    async (accPublicKey: string, deployment: string, feeCredits: number, feeRecord?: string) => {},
    []
  );

  const getDAppPayload = useCallback(async (id: string) => {}, []);

  const confirmDAppPermission = useCallback(async (id: string, confirmed: boolean, publicKey: string) => {}, []);

  const confirmDAppSign = useCallback(async (id: string, confirmed: boolean) => {}, []);

  const confirmDAppDecrypt = useCallback(async (id: string, confirmed: boolean) => {}, []);

  const confirmDAppRecords = useCallback(async (id: string, confirmed: boolean) => {}, []);

  const confirmDAppTransaction = useCallback(async (id: string, confirmed: boolean, delegate: boolean) => {}, []);

  const confirmDAppBulkTransactions = useCallback(async (id: string, confirmed: boolean, delegate: boolean) => {}, []);

  const confirmDAppDeploy = useCallback(async (id: string, confirmed: boolean, delegate: boolean) => {}, []);

  const getAllDAppSessions = useCallback(async () => {}, []);

  const removeDAppSession = useCallback(async (origin: string) => {}, []);

  const getOwnedRecords = useCallback(async (accPublicKey: string) => {}, []);

  return {
    state,
    chainStatus,

    // Aliases
    status,
    defaultNetworks,
    networks,
    accounts,
    settings,
    currentAccount,
    ownMnemonic,
    idle,
    locked,
    ready,

    // Misc
    confirmation,
    resetConfirmation,

    // Actions
    registerWallet,
    unlock,

    createAccount,
    updateCurrentAccount,
    revealViewKey,
    revealPrivateKey,
    revealMnemonic,
    removeAccount,
    editAccountName,
    importAccount,
    importWatchOnlyAccount,
    importMnemonicAccount,
    updateSettings,
    authorizeTransaction,
    authorizeDeploy,
    getDAppPayload,
    confirmDAppPermission,
    confirmDAppSign,
    confirmDAppDecrypt,
    confirmDAppRecords,
    confirmDAppTransaction,
    confirmDAppBulkTransactions,
    confirmDAppDeploy,
    getAllDAppSessions,
    removeDAppSession,
    decryptCiphertexts,
    getOwnedRecords
  };
});

export type MidenClient = ReturnType<typeof useMidenClient>;

export async function request<T extends WalletRequest>(req: T) {
  const res = await getIntercom().request(req);
  assertResponse('type' in res);
  return res as WalletResponse;
}

export function assertResponse(condition: any): asserts condition {
  if (!condition) {
    throw new Error('Invalid response received.');
  }
}
