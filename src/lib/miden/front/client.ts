import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AllowedPrivateData, PrivateDataPermission } from '@demox-labs/miden-wallet-adapter-base';
import constate from 'constate';

import { IntercomClient } from 'lib/intercom';
import {
  WalletMessageType,
  WalletNotification,
  WalletRequest,
  WalletResponse,
  WalletSettings,
  WalletStatus
} from 'lib/shared/types';
import { useRetryableSWR } from 'lib/swr';
import { retryWithTimeout } from 'lib/utility/retry';
import { WalletType } from 'screens/onboarding/types';

import { MidenMessageType, MidenState } from '../types';
import { AutoSync } from './autoSync';

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

export const [MidenContextProvider, useMidenContext] = constate(() => {
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
    AutoSync.updateState(state);
  }, [state]);

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
  const registerWallet = useCallback(
    async (password: string, mnemonic?: string, ownMnemonic?: boolean) => {
      const res = await request({
        type: WalletMessageType.NewWalletRequest,
        password,
        mnemonic,
        ownMnemonic
      });
      assertResponse(res.type === WalletMessageType.NewWalletResponse);
      await mutate();
    },
    [mutate]
  );

  const importWalletFromClient = useCallback(async (password: string, mnemonic: string) => {
    const res = await request({
      type: WalletMessageType.ImportFromClientRequest,
      password,
      mnemonic
    });
    assertResponse(res.type === WalletMessageType.ImportFromClientResponse);
  }, []);

  const unlock = useCallback(async (password: string) => {
    const res = await request({
      type: WalletMessageType.UnlockRequest,
      password
    });
    assertResponse(res.type === WalletMessageType.UnlockResponse);
  }, []);

  const createAccount = useCallback(async (walletType: WalletType, name?: string) => {
    const res = await request({
      type: WalletMessageType.CreateAccountRequest,
      walletType: walletType,
      name: name
    });
    assertResponse(res.type === WalletMessageType.CreateAccountResponse);
  }, []);

  const updateCurrentAccount = useCallback(async (accountPublicKey: string) => {
    const res = await request({
      type: WalletMessageType.UpdateCurrentAccountRequest,
      accountPublicKey
    });
    assertResponse(res.type === WalletMessageType.UpdateCurrentAccountResponse);
  }, []);

  const decryptCiphertexts = useCallback(async (accPublicKey: string, ciphertexts: string[]) => {}, []);

  const revealViewKey = useCallback(async (accountPublicKey: string, password: string) => {}, []);

  const revealPrivateKey = useCallback(async (accountPublicKey: string, password: string) => {}, []);

  const revealMnemonic = useCallback(async (password: string) => {
    const res = await request({
      type: WalletMessageType.RevealMnemonicRequest,
      password
    });
    assertResponse(res.type === WalletMessageType.RevealMnemonicResponse);
    return res.mnemonic;
  }, []);

  const removeAccount = useCallback(async (accountPublicKey: string, password: string) => {}, []);

  const editAccountName = useCallback(async (accountPublicKey: string, name: string) => {
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

  const updateSettings = useCallback(async (newSettings: Partial<WalletSettings>) => {
    const res = await request({
      type: WalletMessageType.UpdateSettingsRequest,
      settings: newSettings
    });
    assertResponse(res.type === WalletMessageType.UpdateSettingsResponse);
  }, []);

  const signData = useCallback(async (publicKey: string, signingInputs: string) => {
    const res = await request({
      type: WalletMessageType.SignDataRequest,
      publicKey,
      signingInputs
    });
    assertResponse(res.type === WalletMessageType.SignDataResponse);
    return res.signature;
  }, []);

  const signTransaction = useCallback(async (publicKey: string, signingInputs: string) => {
    const res = await request({
      type: WalletMessageType.SignTransactionRequest,
      publicKey,
      signingInputs
    });
    assertResponse(res.type === WalletMessageType.SignTransactionResponse);
    return res.signature;
  }, []);

  const getAuthSecretKey = useCallback(async (key: string) => {
    const res = await request({
      type: WalletMessageType.GetAuthSecretKeyRequest,
      key
    });
    assertResponse(res.type === WalletMessageType.GetAuthSecretKeyResponse);
    return res.key;
  }, []);

  const getDAppPayload = useCallback(async (id: string) => {
    const res = await request({
      type: MidenMessageType.DAppGetPayloadRequest,
      id
    });
    assertResponse(res.type === MidenMessageType.DAppGetPayloadResponse);
    return res.payload;
  }, []);

  const confirmDAppPermission = useCallback(
    async (
      id: string,
      confirmed: boolean,
      accountId: string,
      privateDataPermission: PrivateDataPermission,
      allowedPrivateData: AllowedPrivateData
    ) => {
      const res = await request({
        type: MidenMessageType.DAppPermConfirmationRequest,
        id,
        confirmed,
        accountPublicKey: confirmed ? accountId : '',
        privateDataPermission,
        allowedPrivateData
      });
      assertResponse(res.type === MidenMessageType.DAppPermConfirmationResponse);
    },
    []
  );

  const confirmDAppSign = useCallback(async (id: string, confirmed: boolean) => {
    const res = await request({
      type: MidenMessageType.DAppSignConfirmationRequest,
      id,
      confirmed
    });
    assertResponse(res.type === MidenMessageType.DAppSignConfirmationResponse);
  }, []);

  const confirmDAppDecrypt = useCallback(async (id: string, confirmed: boolean) => {}, []);

  const confirmDAppPrivateNotes = useCallback(async (id: string, confirmed: boolean) => {
    const res = await request({
      type: MidenMessageType.DAppPrivateNotesConfirmationRequest,
      id,
      confirmed
    });
    assertResponse(res.type === MidenMessageType.DAppPrivateNotesConfirmationResponse);
  }, []);

  const confirmDAppAssets = useCallback(async (id: string, confirmed: boolean) => {
    const res = await request({
      type: MidenMessageType.DAppAssetsConfirmationRequest,
      id,
      confirmed
    });
    assertResponse(res.type === MidenMessageType.DAppAssetsConfirmationResponse);
  }, []);

  const confirmDAppImportPrivateNote = useCallback(async (id: string, confirmed: boolean) => {
    const res = await request({
      type: MidenMessageType.DAppImportPrivateNoteConfirmationRequest,
      id,
      confirmed
    });
    assertResponse(res.type === MidenMessageType.DAppImportPrivateNoteConfirmationResponse);
  }, []);

  const confirmDAppTransaction = useCallback(async (id: string, confirmed: boolean, delegate: boolean) => {
    const res = await request({
      type: MidenMessageType.DAppTransactionConfirmationRequest,
      id,
      confirmed,
      delegate
    });
    assertResponse(res.type === MidenMessageType.DAppTransactionConfirmationResponse);
  }, []);

  const confirmDAppBulkTransactions = useCallback(async (id: string, confirmed: boolean, delegate: boolean) => {}, []);

  const confirmDAppDeploy = useCallback(async (id: string, confirmed: boolean, delegate: boolean) => {}, []);

  const getAllDAppSessions = useCallback(async () => {
    const res = await request({
      type: MidenMessageType.DAppGetAllSessionsRequest
    });
    assertResponse(res.type === MidenMessageType.DAppGetAllSessionsResponse);
    return res.sessions;
  }, []);

  const removeDAppSession = useCallback(async (origin: string) => {
    const res = await request({
      type: MidenMessageType.DAppRemoveSessionRequest,
      origin
    });
    assertResponse(res.type === MidenMessageType.DAppRemoveSessionResponse);
  }, []);

  const getOwnedRecords = useCallback(async (accPublicKey: string) => {}, []);

  return {
    state,
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
    signData,
    signTransaction,
    getAuthSecretKey,
    getDAppPayload,
    confirmDAppPermission,
    confirmDAppSign,
    confirmDAppDecrypt,
    confirmDAppPrivateNotes,
    confirmDAppAssets,
    confirmDAppImportPrivateNote,
    confirmDAppTransaction,
    confirmDAppBulkTransactions,
    confirmDAppDeploy,
    getAllDAppSessions,
    removeDAppSession,
    decryptCiphertexts,
    getOwnedRecords,
    importWalletFromClient
  };
});

export type MidenContext = ReturnType<typeof useMidenContext>;

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
