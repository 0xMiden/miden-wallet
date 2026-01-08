import '../../../test/jest-mocks';

import { WalletMessageType, WalletStatus } from 'lib/shared/types';
import { WalletType } from 'screens/onboarding/types';

import { useWalletStore } from './index';

// Mock the intercom module
const mockRequest = jest.fn();
jest.mock('lib/intercom', () => ({
  IntercomClient: jest.fn().mockImplementation(() => ({
    request: mockRequest,
    subscribe: jest.fn(() => () => {})
  }))
}));

// Mock fetchTokenMetadata
jest.mock('lib/miden/metadata', () => ({
  fetchTokenMetadata: jest.fn(),
  MIDEN_METADATA: { name: 'Miden', symbol: 'MIDEN', decimals: 8 }
}));

// Mock fetchBalances utility
jest.mock('./utils/fetchBalances', () => ({
  fetchBalances: jest.fn()
}));

describe('useWalletStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useWalletStore.setState({
      status: WalletStatus.Idle,
      accounts: [],
      currentAccount: null,
      networks: [],
      settings: null,
      ownMnemonic: null,
      balances: {},
      balancesLoading: {},
      balancesLastFetched: {},
      assetsMetadata: {},
      selectedNetworkId: null,
      confirmation: null,
      isInitialized: false,
      isSyncing: false,
      lastSyncedAt: null
    });
    mockRequest.mockReset();
  });

  describe('syncFromBackend', () => {
    it('updates store state from backend', () => {
      const { syncFromBackend } = useWalletStore.getState();

      syncFromBackend({
        status: WalletStatus.Ready,
        accounts: [{ publicKey: 'pk1', name: 'Account 1', isPublic: true, type: WalletType.OnChain, hdIndex: 0 }],
        currentAccount: { publicKey: 'pk1', name: 'Account 1', isPublic: true, type: WalletType.OnChain, hdIndex: 0 },
        networks: [],
        settings: { contacts: [] },
        ownMnemonic: true
      });

      const state = useWalletStore.getState();
      expect(state.status).toBe(WalletStatus.Ready);
      expect(state.accounts).toHaveLength(1);
      expect(state.currentAccount?.publicKey).toBe('pk1');
      expect(state.isInitialized).toBe(true);
      expect(state.lastSyncedAt).toBeGreaterThan(0);
    });
  });

  describe('editAccountName', () => {
    const mockAccounts = [
      { publicKey: 'pk1', name: 'Account 1', isPublic: true, type: WalletType.OnChain, hdIndex: 0 },
      { publicKey: 'pk2', name: 'Account 2', isPublic: false, type: WalletType.OnChain, hdIndex: 1 }
    ];

    beforeEach(() => {
      useWalletStore.setState({ accounts: mockAccounts });
    });

    it('optimistically updates account name', async () => {
      mockRequest.mockResolvedValueOnce({ type: WalletMessageType.EditAccountResponse });

      const { editAccountName } = useWalletStore.getState();
      const promise = editAccountName('pk1', 'New Name');

      // Check optimistic update happened immediately
      const stateAfterOptimistic = useWalletStore.getState();
      expect(stateAfterOptimistic.accounts[0].name).toBe('New Name');

      await promise;

      // Verify request was made
      expect(mockRequest).toHaveBeenCalledWith({
        type: WalletMessageType.EditAccountRequest,
        accountPublicKey: 'pk1',
        name: 'New Name'
      });
    });

    it('trims whitespace from account name', async () => {
      mockRequest.mockResolvedValueOnce({ type: WalletMessageType.EditAccountResponse });

      const { editAccountName } = useWalletStore.getState();
      await editAccountName('pk1', '  Trimmed Name  ');

      const state = useWalletStore.getState();
      expect(state.accounts[0].name).toBe('Trimmed Name');
    });

    it('rolls back on error', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Network error'));

      const { editAccountName } = useWalletStore.getState();

      await expect(editAccountName('pk1', 'Failed Name')).rejects.toThrow('Network error');

      // Verify rollback happened
      const state = useWalletStore.getState();
      expect(state.accounts[0].name).toBe('Account 1');
    });

    it('rolls back on invalid response', async () => {
      mockRequest.mockResolvedValueOnce({ type: 'WrongResponseType' });

      const { editAccountName } = useWalletStore.getState();

      await expect(editAccountName('pk1', 'Failed Name')).rejects.toThrow('Invalid response');

      // Verify rollback happened
      const state = useWalletStore.getState();
      expect(state.accounts[0].name).toBe('Account 1');
    });
  });

  describe('updateCurrentAccount', () => {
    const mockAccounts = [
      { publicKey: 'pk1', name: 'Account 1', isPublic: true, type: WalletType.OnChain, hdIndex: 0 },
      { publicKey: 'pk2', name: 'Account 2', isPublic: false, type: WalletType.OnChain, hdIndex: 1 }
    ];

    beforeEach(() => {
      useWalletStore.setState({
        accounts: mockAccounts,
        currentAccount: mockAccounts[0]
      });
    });

    it('optimistically updates current account', async () => {
      mockRequest.mockResolvedValueOnce({ type: WalletMessageType.UpdateCurrentAccountResponse });

      const { updateCurrentAccount } = useWalletStore.getState();
      const promise = updateCurrentAccount('pk2');

      // Check optimistic update happened immediately
      const stateAfterOptimistic = useWalletStore.getState();
      expect(stateAfterOptimistic.currentAccount?.publicKey).toBe('pk2');

      await promise;

      expect(mockRequest).toHaveBeenCalledWith({
        type: WalletMessageType.UpdateCurrentAccountRequest,
        accountPublicKey: 'pk2'
      });
    });

    it('rolls back on error', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Network error'));

      const { updateCurrentAccount } = useWalletStore.getState();

      await expect(updateCurrentAccount('pk2')).rejects.toThrow('Network error');

      // Verify rollback happened
      const state = useWalletStore.getState();
      expect(state.currentAccount?.publicKey).toBe('pk1');
    });

    it('does not update if account not found', async () => {
      mockRequest.mockResolvedValueOnce({ type: WalletMessageType.UpdateCurrentAccountResponse });

      const { updateCurrentAccount } = useWalletStore.getState();
      await updateCurrentAccount('nonexistent');

      // Current account should remain unchanged (optimistic update skipped)
      const state = useWalletStore.getState();
      expect(state.currentAccount?.publicKey).toBe('pk1');
    });
  });

  describe('updateSettings', () => {
    const mockContact = { name: 'Alice', address: 'addr1' };
    const mockSettings = { contacts: [mockContact] };

    beforeEach(() => {
      useWalletStore.setState({ settings: mockSettings });
    });

    it('optimistically updates settings', async () => {
      mockRequest.mockResolvedValueOnce({ type: WalletMessageType.UpdateSettingsResponse });
      const newContact = { name: 'Bob', address: 'addr2' };

      const { updateSettings } = useWalletStore.getState();
      const promise = updateSettings({ contacts: [mockContact, newContact] });

      // Check optimistic update happened immediately
      const stateAfterOptimistic = useWalletStore.getState();
      expect(stateAfterOptimistic.settings?.contacts).toHaveLength(2);

      await promise;

      expect(mockRequest).toHaveBeenCalledWith({
        type: WalletMessageType.UpdateSettingsRequest,
        settings: { contacts: [mockContact, newContact] }
      });
    });

    it('merges partial settings', async () => {
      mockRequest.mockResolvedValueOnce({ type: WalletMessageType.UpdateSettingsResponse });
      const newContacts = [{ name: 'Charlie', address: 'addr3' }];

      const { updateSettings } = useWalletStore.getState();
      await updateSettings({ contacts: newContacts });

      const state = useWalletStore.getState();
      // Note: contacts get replaced, not merged (that's expected behavior)
      expect(state.settings?.contacts).toEqual(newContacts);
    });

    it('rolls back on error', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Network error'));
      const newContacts = [{ name: 'Dave', address: 'addr4' }];

      const { updateSettings } = useWalletStore.getState();

      await expect(updateSettings({ contacts: newContacts })).rejects.toThrow('Network error');

      // Verify rollback happened
      const state = useWalletStore.getState();
      expect(state.settings?.contacts).toEqual([mockContact]);
    });
  });

  describe('setAssetsMetadata', () => {
    it('merges new metadata with existing', () => {
      useWalletStore.setState({
        assetsMetadata: { asset1: { name: 'Token 1', symbol: 'TK1', decimals: 8 } }
      });

      const { setAssetsMetadata } = useWalletStore.getState();
      setAssetsMetadata({ asset2: { name: 'Token 2', symbol: 'TK2', decimals: 6 } });

      const state = useWalletStore.getState();
      expect(state.assetsMetadata).toEqual({
        asset1: { name: 'Token 1', symbol: 'TK1', decimals: 8 },
        asset2: { name: 'Token 2', symbol: 'TK2', decimals: 6 }
      });
    });
  });

  describe('UI actions', () => {
    it('setSelectedNetworkId updates network', () => {
      const { setSelectedNetworkId } = useWalletStore.getState();
      setSelectedNetworkId('network-1');

      expect(useWalletStore.getState().selectedNetworkId).toBe('network-1');
    });

    it('setConfirmation and resetConfirmation work correctly', () => {
      const { setConfirmation, resetConfirmation } = useWalletStore.getState();

      setConfirmation({ id: 'confirm-1', error: null });
      expect(useWalletStore.getState().confirmation).toEqual({ id: 'confirm-1', error: null });

      resetConfirmation();
      expect(useWalletStore.getState().confirmation).toBeNull();
    });
  });
});
