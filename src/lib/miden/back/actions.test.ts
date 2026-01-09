import { WalletStatus } from 'lib/shared/types';

// Create mock vault instance
const mockVault = {
  fetchAccounts: jest.fn(),
  fetchSettings: jest.fn(),
  getCurrentAccount: jest.fn(),
  setCurrentAccount: jest.fn(),
  isOwnMnemonic: jest.fn(),
  createHDAccount: jest.fn(),
  editAccountName: jest.fn(),
  updateSettings: jest.fn(),
  signTransaction: jest.fn(),
  getAuthSecretKey: jest.fn()
};

// Mock store callbacks
const mockInited = jest.fn();
const mockLocked = jest.fn();
const mockAccountsUpdated = jest.fn();
const mockSettingsUpdated = jest.fn();
const mockCurrentAccountUpdated = jest.fn();

// Mock store state
let mockStoreState = {
  inited: true,
  status: WalletStatus.Ready,
  accounts: [],
  currentAccount: null,
  networks: [],
  settings: null,
  ownMnemonic: null
};

jest.mock('./vault', () => ({
  Vault: {
    isExist: jest.fn(),
    spawn: jest.fn(),
    setup: jest.fn(),
    revealMnemonic: jest.fn(),
    spawnFromMidenClient: jest.fn(),
    getCurrentAccountPublicKey: jest.fn()
  }
}));

jest.mock('./store', () => ({
  store: {
    getState: jest.fn(() => mockStoreState)
  },
  toFront: jest.fn((state) => state),
  inited: jest.fn((...args: any[]) => mockInited(...args)),
  locked: jest.fn((...args: any[]) => mockLocked(...args)),
  unlocked: jest.fn(),
  accountsUpdated: jest.fn((...args: any[]) => mockAccountsUpdated(...args)),
  settingsUpdated: jest.fn((...args: any[]) => mockSettingsUpdated(...args)),
  currentAccountUpdated: jest.fn((...args: any[]) => mockCurrentAccountUpdated(...args)),
  withInited: jest.fn(async (fn) => fn()),
  withUnlocked: jest.fn(async (fn) => fn({ vault: mockVault }))
}));

jest.mock('./dapp', () => ({
  getAllDApps: jest.fn()
}));

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({ DAppEnabled: true })
    }
  }
}));

import {
  getFrontState,
  lock,
  updateCurrentAccount,
  editAccount,
  updateSettings,
  signTransaction,
  getAuthSecretKey,
  getAllDAppSessions
} from './actions';

describe('actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreState = {
      inited: true,
      status: WalletStatus.Ready,
      accounts: [],
      currentAccount: null,
      networks: [],
      settings: null,
      ownMnemonic: null
    };
  });

  describe('getFrontState', () => {
    it('returns state when inited is true', async () => {
      mockStoreState.inited = true;
      mockStoreState.status = WalletStatus.Ready;

      const result = await getFrontState();

      expect(result.status).toBe(WalletStatus.Ready);
    });
  });

  describe('lock', () => {
    it('calls locked', async () => {
      await lock();

      expect(mockLocked).toHaveBeenCalled();
    });
  });

  describe('updateCurrentAccount', () => {
    it('updates current account and fires event', async () => {
      const newAccount = { publicKey: 'pk1', name: 'Account 1' };
      mockVault.setCurrentAccount.mockResolvedValueOnce(newAccount);

      await updateCurrentAccount('pk1');

      expect(mockVault.setCurrentAccount).toHaveBeenCalledWith('pk1');
      expect(mockCurrentAccountUpdated).toHaveBeenCalledWith(newAccount);
    });
  });

  describe('editAccount', () => {
    it('trims name and updates accounts', async () => {
      const updatedAccounts = { accounts: [{ publicKey: 'pk1', name: 'Trimmed' }] };
      mockVault.editAccountName.mockResolvedValueOnce(updatedAccounts);

      await editAccount('pk1', '  Trimmed  ');

      expect(mockVault.editAccountName).toHaveBeenCalledWith('pk1', 'Trimmed');
      expect(mockAccountsUpdated).toHaveBeenCalledWith(updatedAccounts);
    });

    it('throws for invalid name', async () => {
      const longName = 'a'.repeat(20); // > 16 chars

      await expect(editAccount('pk1', longName)).rejects.toThrow('Invalid name');
    });
  });

  describe('updateSettings', () => {
    it('updates settings and fires event', async () => {
      const newSettings = { contacts: [] };
      mockVault.updateSettings.mockResolvedValueOnce(newSettings);

      await updateSettings({ contacts: [] });

      expect(mockVault.updateSettings).toHaveBeenCalledWith({ contacts: [] });
      expect(mockSettingsUpdated).toHaveBeenCalledWith(newSettings);
    });
  });

  describe('signTransaction', () => {
    it('calls vault signTransaction', async () => {
      mockVault.signTransaction.mockResolvedValueOnce('signature');

      const result = await signTransaction('pk1', 'inputs');

      expect(mockVault.signTransaction).toHaveBeenCalledWith('pk1', 'inputs');
      expect(result).toBe('signature');
    });
  });

  describe('getAuthSecretKey', () => {
    it('calls vault getAuthSecretKey', async () => {
      mockVault.getAuthSecretKey.mockResolvedValueOnce('secret-key');

      const result = await getAuthSecretKey('key-id');

      expect(mockVault.getAuthSecretKey).toHaveBeenCalledWith('key-id');
      expect(result).toBe('secret-key');
    });
  });

  describe('getAllDAppSessions', () => {
    it('returns all DApp sessions', async () => {
      const { getAllDApps } = jest.requireMock('./dapp');
      getAllDApps.mockResolvedValueOnce({ 'https://example.com': [] });

      const result = await getAllDAppSessions();

      expect(result).toEqual({ 'https://example.com': [] });
    });
  });
});

