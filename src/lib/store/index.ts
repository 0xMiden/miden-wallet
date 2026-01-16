import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { createIntercomClient, IIntercomClient } from 'lib/intercom/client';
import { fetchTokenMetadata } from 'lib/miden/metadata';
import { MidenMessageType, MidenState } from 'lib/miden/types';
import { WalletMessageType, WalletRequest, WalletResponse, WalletStatus } from 'lib/shared/types';

import { WalletStore } from './types';
import { fetchBalances } from './utils/fetchBalances';

// Singleton intercom client
let intercom: IIntercomClient | null = null;
function getIntercom(): IIntercomClient {
  if (!intercom) {
    intercom = createIntercomClient();
  }
  return intercom;
}

// Helper to make requests to backend
async function request<T extends WalletRequest>(req: T): Promise<WalletResponse> {
  const res = await getIntercom().request(req);
  if (!('type' in res)) {
    throw new Error('Invalid response received.');
  }
  return res as WalletResponse;
}

// Helper to assert response type
function assertResponse(condition: boolean): asserts condition {
  if (!condition) {
    throw new Error('Invalid response received.');
  }
}

export const useWalletStore = create<WalletStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial wallet state
    status: WalletStatus.Idle,
    accounts: [],
    currentAccount: null,
    networks: [],
    settings: null,
    ownMnemonic: null,

    // Initial balance state
    balances: {},
    balancesLoading: {},
    balancesLastFetched: {},

    // Initial assets state
    assetsMetadata: {},

    // Initial UI state
    selectedNetworkId: null,
    confirmation: null,

    // Initial fiat currency state
    selectedFiatCurrency: null,
    fiatRates: null,
    fiatRatesLoading: false,

    // Initial sync state
    isInitialized: false,
    isSyncing: false,
    lastSyncedAt: null,
    hasCompletedInitialSync: false,

    // Initial transaction modal state (mobile only)
    isTransactionModalOpen: false,

    // Sync action - updates store from backend state
    syncFromBackend: (state: MidenState) => {
      set({
        status: state.status,
        accounts: state.accounts,
        currentAccount: state.currentAccount,
        networks: state.networks,
        settings: state.settings,
        ownMnemonic: state.ownMnemonic,
        isInitialized: true,
        lastSyncedAt: Date.now()
      });
    },

    // Auth actions
    registerWallet: async (password, mnemonic, ownMnemonic) => {
      const res = await request({
        type: WalletMessageType.NewWalletRequest,
        password,
        mnemonic,
        ownMnemonic
      });
      assertResponse(res.type === WalletMessageType.NewWalletResponse);
      // State will be synced via StateUpdated notification
    },

    importWalletFromClient: async (password, mnemonic) => {
      const res = await request({
        type: WalletMessageType.ImportFromClientRequest,
        password,
        mnemonic
      });
      assertResponse(res.type === WalletMessageType.ImportFromClientResponse);
    },

    unlock: async password => {
      const res = await request({
        type: WalletMessageType.UnlockRequest,
        password
      });
      assertResponse(res.type === WalletMessageType.UnlockResponse);
    },

    // Account actions
    createAccount: async (walletType, name) => {
      const res = await request({
        type: WalletMessageType.CreateAccountRequest,
        walletType,
        name
      });
      assertResponse(res.type === WalletMessageType.CreateAccountResponse);
    },

    updateCurrentAccount: async accountPublicKey => {
      const { accounts, currentAccount } = get();
      const prevAccount = currentAccount;
      const newAccount = accounts.find(a => a.publicKey === accountPublicKey) || null;

      // Optimistic update
      if (newAccount) {
        set({ currentAccount: newAccount });
      }

      try {
        const res = await request({
          type: WalletMessageType.UpdateCurrentAccountRequest,
          accountPublicKey
        });
        assertResponse(res.type === WalletMessageType.UpdateCurrentAccountResponse);
      } catch (error) {
        // Rollback on error
        set({ currentAccount: prevAccount });
        throw error;
      }
    },

    editAccountName: async (accountPublicKey, name) => {
      const { accounts } = get();
      const prevAccounts = accounts;

      // Optimistic update
      set({
        accounts: accounts.map(a => (a.publicKey === accountPublicKey ? { ...a, name: name.trim() } : a))
      });

      try {
        const res = await request({
          type: WalletMessageType.EditAccountRequest,
          accountPublicKey,
          name
        });
        assertResponse(res.type === WalletMessageType.EditAccountResponse);
      } catch (error) {
        // Rollback on error
        set({ accounts: prevAccounts });
        throw error;
      }
    },

    revealMnemonic: async password => {
      const res = await request({
        type: WalletMessageType.RevealMnemonicRequest,
        password
      });
      assertResponse(res.type === WalletMessageType.RevealMnemonicResponse);
      return res.mnemonic;
    },

    // Settings actions
    updateSettings: async newSettings => {
      const { settings } = get();
      const prevSettings = settings;

      // Optimistic update
      set({
        settings: settings ? { ...settings, ...newSettings } : (newSettings as any)
      });

      try {
        const res = await request({
          type: WalletMessageType.UpdateSettingsRequest,
          settings: newSettings
        });
        assertResponse(res.type === WalletMessageType.UpdateSettingsResponse);
      } catch (error) {
        // Rollback on error
        set({ settings: prevSettings });
        throw error;
      }
    },

    // Signing actions
    signData: async (publicKey, signingInputs) => {
      const res = await request({
        type: WalletMessageType.SignDataRequest,
        publicKey,
        signingInputs
      });
      assertResponse(res.type === WalletMessageType.SignDataResponse);
      return res.signature;
    },

    signTransaction: async (publicKey, signingInputs) => {
      const res = await request({
        type: WalletMessageType.SignTransactionRequest,
        publicKey,
        signingInputs
      });
      assertResponse(res.type === WalletMessageType.SignTransactionResponse);
      const signatureAsHex = res.signature;
      return new Uint8Array(Buffer.from(signatureAsHex, 'hex'));
    },

    getAuthSecretKey: async key => {
      const res = await request({
        type: WalletMessageType.GetAuthSecretKeyRequest,
        key
      });
      assertResponse(res.type === WalletMessageType.GetAuthSecretKeyResponse);
      return res.key;
    },

    // DApp actions
    getDAppPayload: async id => {
      const res = await request({
        type: MidenMessageType.DAppGetPayloadRequest,
        id
      });
      assertResponse(res.type === MidenMessageType.DAppGetPayloadResponse);
      return res.payload;
    },

    confirmDAppPermission: async (id, confirmed, accountId, privateDataPermission, allowedPrivateData) => {
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

    confirmDAppSign: async (id, confirmed) => {
      const res = await request({
        type: MidenMessageType.DAppSignConfirmationRequest,
        id,
        confirmed
      });
      assertResponse(res.type === MidenMessageType.DAppSignConfirmationResponse);
    },

    confirmDAppPrivateNotes: async (id, confirmed) => {
      const res = await request({
        type: MidenMessageType.DAppPrivateNotesConfirmationRequest,
        id,
        confirmed
      });
      assertResponse(res.type === MidenMessageType.DAppPrivateNotesConfirmationResponse);
    },

    confirmDAppAssets: async (id, confirmed) => {
      const res = await request({
        type: MidenMessageType.DAppAssetsConfirmationRequest,
        id,
        confirmed
      });
      assertResponse(res.type === MidenMessageType.DAppAssetsConfirmationResponse);
    },

    confirmDAppImportPrivateNote: async (id, confirmed) => {
      const res = await request({
        type: MidenMessageType.DAppImportPrivateNoteConfirmationRequest,
        id,
        confirmed
      });
      assertResponse(res.type === MidenMessageType.DAppImportPrivateNoteConfirmationResponse);
    },

    confirmDAppConsumableNotes: async (id, confirmed) => {
      const res = await request({
        type: MidenMessageType.DAppConsumableNotesConfirmationRequest,
        id,
        confirmed
      });
      assertResponse(res.type === MidenMessageType.DAppConsumableNotesConfirmationResponse);
    },

    confirmDAppTransaction: async (id, confirmed, delegate) => {
      const res = await request({
        type: MidenMessageType.DAppTransactionConfirmationRequest,
        id,
        confirmed,
        delegate
      });
      assertResponse(res.type === MidenMessageType.DAppTransactionConfirmationResponse);
    },

    getAllDAppSessions: async () => {
      const res = await request({
        type: MidenMessageType.DAppGetAllSessionsRequest
      });
      assertResponse(res.type === MidenMessageType.DAppGetAllSessionsResponse);
      return res.sessions;
    },

    removeDAppSession: async origin => {
      const res = await request({
        type: MidenMessageType.DAppRemoveSessionRequest,
        origin
      });
      assertResponse(res.type === MidenMessageType.DAppRemoveSessionResponse);
    },

    // UI actions
    setSelectedNetworkId: networkId => {
      set({ selectedNetworkId: networkId });
    },

    setConfirmation: confirmation => {
      set({ confirmation });
    },

    resetConfirmation: () => {
      set({ confirmation: null });
    },

    // Balance actions
    fetchBalances: async (accountAddress, tokenMetadatas) => {
      const { balancesLoading, setAssetsMetadata } = get();

      // Skip if already loading
      if (balancesLoading[accountAddress]) {
        return;
      }

      set({
        balancesLoading: { ...balancesLoading, [accountAddress]: true }
      });

      try {
        const balances = await fetchBalances(accountAddress, tokenMetadatas, { setAssetsMetadata });
        set(state => ({
          balances: { ...state.balances, [accountAddress]: balances },
          balancesLoading: { ...state.balancesLoading, [accountAddress]: false },
          balancesLastFetched: { ...state.balancesLastFetched, [accountAddress]: Date.now() }
        }));
      } catch (error) {
        set(state => ({
          balancesLoading: { ...state.balancesLoading, [accountAddress]: false }
        }));
        throw error;
      }
    },

    setBalancesLoading: (accountAddress, isLoading) => {
      set(state => ({
        balancesLoading: { ...state.balancesLoading, [accountAddress]: isLoading }
      }));
    },

    // Asset actions
    setAssetsMetadata: metadata => {
      set(state => ({
        assetsMetadata: { ...state.assetsMetadata, ...metadata }
      }));
    },

    fetchAssetMetadata: async assetId => {
      try {
        const { base } = await fetchTokenMetadata(assetId);
        set(state => ({
          assetsMetadata: { ...state.assetsMetadata, [assetId]: base }
        }));
        return base;
      } catch {
        return null;
      }
    },

    // Fiat currency actions
    setSelectedFiatCurrency: currency => {
      set({ selectedFiatCurrency: currency });
    },

    setFiatRates: rates => {
      set({ fiatRates: rates });
    },

    fetchFiatRates: async () => {
      const { fiatRatesLoading } = get();
      if (fiatRatesLoading) return;

      set({ fiatRatesLoading: true });
      try {
        // TODO: implement real fiat rate fetching
        const rates = { usd: 1 };
        set({ fiatRates: rates, fiatRatesLoading: false });
      } catch {
        set({ fiatRatesLoading: false });
      }
    },

    // Sync actions
    setSyncStatus: isSyncing => {
      // When sync completes (isSyncing becomes false), mark initial sync as done
      if (!isSyncing) {
        set({ isSyncing, hasCompletedInitialSync: true });
      } else {
        set({ isSyncing });
      }
    },

    // Transaction modal actions (mobile only)
    openTransactionModal: () => {
      set({ isTransactionModalOpen: true });
    },
    closeTransactionModal: () => {
      set({ isTransactionModalOpen: false });
    }
  }))
);

// Export the intercom getter for use in sync hook
export { getIntercom };

// Derived selectors for common patterns
export const selectIsReady = (state: WalletStore) => state.status === WalletStatus.Ready;
export const selectIsLocked = (state: WalletStore) => state.status === WalletStatus.Locked;
export const selectIsIdle = (state: WalletStore) => state.status === WalletStatus.Idle;
