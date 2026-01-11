import { WalletStatus } from 'lib/shared/types';
import { WalletType } from 'screens/onboarding/types';

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
  getAllDApps: jest.fn(),
  removeDApp: jest.fn(),
  getCurrentPermission: jest.fn(),
  requestPermission: jest.fn(),
  requestDisconnect: jest.fn(),
  requestTransaction: jest.fn(),
  requestSendTransaction: jest.fn(),
  requestConsumeTransaction: jest.fn(),
  requestPrivateNotes: jest.fn(),
  requestSign: jest.fn(),
  requestAssets: jest.fn(),
  requestImportPrivateNote: jest.fn(),
  requestConsumableNotes: jest.fn()
}));

jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn().mockResolvedValue({ DAppEnabled: true })
    }
  }
}));

import { MidenDAppMessageType } from 'lib/adapter/types';

import {
  getFrontState,
  lock,
  updateCurrentAccount,
  editAccount,
  updateSettings,
  signTransaction,
  getAuthSecretKey,
  getAllDAppSessions,
  getCurrentAccount,
  createHDAccount,
  processDApp
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

  describe('getCurrentAccount', () => {
    it('returns current account from vault', async () => {
      const account = { publicKey: 'pk1', name: 'My Account' };
      mockVault.getCurrentAccount.mockResolvedValueOnce(account);

      const result = await getCurrentAccount();

      expect(mockVault.getCurrentAccount).toHaveBeenCalled();
      expect(result).toEqual(account);
    });
  });

  describe('createHDAccount', () => {
    it('creates HD account without name', async () => {
      const accounts = [{ publicKey: 'pk1', name: 'Account 1' }];
      mockVault.createHDAccount.mockResolvedValueOnce(accounts);

      await createHDAccount(WalletType.OnChain);

      expect(mockVault.createHDAccount).toHaveBeenCalledWith(WalletType.OnChain, undefined);
      expect(mockAccountsUpdated).toHaveBeenCalledWith({ accounts });
    });

    it('creates HD account with valid name', async () => {
      const accounts = [{ publicKey: 'pk1', name: 'MyWallet' }];
      mockVault.createHDAccount.mockResolvedValueOnce(accounts);

      await createHDAccount(WalletType.OnChain, '  MyWallet  ');

      expect(mockVault.createHDAccount).toHaveBeenCalledWith(WalletType.OnChain, 'MyWallet');
      expect(mockAccountsUpdated).toHaveBeenCalledWith({ accounts });
    });

    it('throws for name longer than 16 characters', async () => {
      const longName = 'a'.repeat(17);

      await expect(createHDAccount(WalletType.OnChain, longName)).rejects.toThrow('Invalid name');
    });
  });

  describe('processDApp', () => {
    it('handles GetCurrentPermissionRequest', async () => {
      const { getCurrentPermission } = jest.requireMock('./dapp');
      getCurrentPermission.mockResolvedValueOnce({ granted: true });

      const result = await processDApp('https://example.com', {
        type: MidenDAppMessageType.GetCurrentPermissionRequest
      } as any);

      expect(getCurrentPermission).toHaveBeenCalledWith('https://example.com');
      expect(result).toEqual({ granted: true });
    });

    it('handles PermissionRequest', async () => {
      const { requestPermission } = jest.requireMock('./dapp');
      requestPermission.mockResolvedValueOnce({ approved: true });

      const req = { type: MidenDAppMessageType.PermissionRequest, data: {} };
      const result = await processDApp('https://example.com', req as any);

      expect(requestPermission).toHaveBeenCalledWith('https://example.com', req);
      expect(result).toEqual({ approved: true });
    });

    it('handles DisconnectRequest', async () => {
      const { requestDisconnect } = jest.requireMock('./dapp');
      requestDisconnect.mockResolvedValueOnce({ disconnected: true });

      const req = { type: MidenDAppMessageType.DisconnectRequest };
      const result = await processDApp('https://example.com', req as any);

      expect(requestDisconnect).toHaveBeenCalledWith('https://example.com', req);
      expect(result).toEqual({ disconnected: true });
    });

    it('handles SignRequest', async () => {
      const { requestSign } = jest.requireMock('./dapp');
      requestSign.mockResolvedValueOnce({ signature: '0x123' });

      const req = { type: MidenDAppMessageType.SignRequest, payload: 'data' };
      const result = await processDApp('https://example.com', req as any);

      expect(requestSign).toHaveBeenCalledWith('https://example.com', req);
      expect(result).toEqual({ signature: '0x123' });
    });

    it('returns undefined for unknown request type', async () => {
      const result = await processDApp('https://example.com', { type: 'UNKNOWN' } as any);

      expect(result).toBeUndefined();
    });
  });
});

