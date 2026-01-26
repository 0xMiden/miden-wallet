import { BasicFungibleFaucetComponent } from '@miden-sdk/miden-sdk';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { isMidenAsset } from 'lib/miden/assets';

import { MIDEN_METADATA, DEFAULT_TOKEN_METADATA } from './defaults';
import { fetchTokenMetadata, NotFoundTokenMetadata } from './fetch';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`)
  }
}));

jest.mock('lib/miden/assets', () => ({
  isMidenAsset: jest.fn()
}));

const mockGetAccount = jest.fn();
const mockImportAccountById = jest.fn();
const mockGetMidenClient = jest.fn(() => ({
  getAccount: mockGetAccount,
  importAccountById: mockImportAccountById
}));

jest.mock('../sdk/miden-client', () => ({
  getMidenClient: () => mockGetMidenClient(),
  withWasmClientLock: jest.fn(<T>(fn: () => Promise<T>) => fn())
}));

jest.mock('@miden-sdk/miden-sdk', () => ({
  BasicFungibleFaucetComponent: {
    fromAccount: jest.fn()
  }
}));

const mockIsMidenAsset = isMidenAsset as unknown as jest.Mock;
const mockFromAccount = BasicFungibleFaucetComponent.fromAccount as unknown as jest.Mock;

describe('metadata/fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccount.mockReset();
    mockImportAccountById.mockReset();
  });

  describe('fetchTokenMetadata', () => {
    it('returns MIDEN_METADATA for miden asset', async () => {
      mockIsMidenAsset.mockReturnValue(true);

      const result = await fetchTokenMetadata('miden', MIDEN_NETWORK_NAME.TESTNET);

      expect(result).toEqual({
        base: MIDEN_METADATA,
        detailed: MIDEN_METADATA
      });
      // Should not call any SDK methods for miden asset
      expect(mockGetAccount).not.toHaveBeenCalled();
      expect(mockImportAccountById).not.toHaveBeenCalled();
    });

    it('fetches metadata from SDK for non-miden assets', async () => {
      mockIsMidenAsset.mockReturnValue(false);
      const mockAccount = { id: 'test' };
      mockGetAccount.mockResolvedValue(mockAccount);
      mockFromAccount.mockReturnValue({
        decimals: () => 8,
        symbol: () => ({ toString: () => 'TEST' })
      });

      const result = await fetchTokenMetadata('test-asset-id', MIDEN_NETWORK_NAME.TESTNET);

      expect(result.base).toEqual({
        decimals: 8,
        symbol: 'TEST',
        name: 'TEST',
        shouldPreferSymbol: true,
        thumbnailUri: 'chrome-extension://test-id/misc/token-logos/default.svg'
      });
      expect(result.detailed).toEqual(result.base);
    });

    it('returns DEFAULT_TOKEN_METADATA when account not found after import', async () => {
      mockIsMidenAsset.mockReturnValue(false);
      // Both calls return null - not in IndexedDB and import fails to load
      mockGetAccount.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      mockImportAccountById.mockResolvedValue(undefined);

      const result = await fetchTokenMetadata('unknown-asset-id', MIDEN_NETWORK_NAME.TESTNET);

      expect(result).toEqual({
        base: DEFAULT_TOKEN_METADATA,
        detailed: DEFAULT_TOKEN_METADATA
      });
    });

    it('throws NotFoundTokenMetadata on SDK error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockIsMidenAsset.mockReturnValue(false);
      mockGetAccount.mockRejectedValue(new Error('SDK error'));

      await expect(fetchTokenMetadata('bad-asset-id', MIDEN_NETWORK_NAME.TESTNET)).rejects.toThrow(
        NotFoundTokenMetadata
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('IndexedDB-first loading optimization', () => {
    it('reads from IndexedDB (getAccount) BEFORE any network fetch (importAccountById)', async () => {
      mockIsMidenAsset.mockReturnValue(false);

      const callOrder: string[] = [];
      mockGetAccount.mockImplementation(async () => {
        callOrder.push('getAccount');
        return { id: 'cached' };
      });
      mockImportAccountById.mockImplementation(async () => {
        callOrder.push('importAccountById');
      });
      mockFromAccount.mockReturnValue({
        decimals: () => 6,
        symbol: () => ({ toString: () => 'CACHED' })
      });

      await fetchTokenMetadata('some-asset-id', MIDEN_NETWORK_NAME.TESTNET);

      // getAccount (IndexedDB read) must be called FIRST
      expect(callOrder[0]).toBe('getAccount');
      // importAccountById should NOT be called at all if account exists
      expect(callOrder).not.toContain('importAccountById');
    });

    it('skips network fetch when account exists in IndexedDB', async () => {
      mockIsMidenAsset.mockReturnValue(false);
      const mockAccount = { id: 'cached-account' };
      mockGetAccount.mockResolvedValue(mockAccount);
      mockFromAccount.mockReturnValue({
        decimals: () => 8,
        symbol: () => ({ toString: () => 'FAST' })
      });

      await fetchTokenMetadata('cached-asset-id', MIDEN_NETWORK_NAME.TESTNET);

      // getAccount should be called (reads from IndexedDB)
      expect(mockGetAccount).toHaveBeenCalledWith('cached-asset-id');
      // importAccountById should NOT be called (no network fetch needed)
      expect(mockImportAccountById).not.toHaveBeenCalled();
    });

    it('only fetches from network when account is NOT in IndexedDB', async () => {
      mockIsMidenAsset.mockReturnValue(false);

      // First call returns null (not in IndexedDB), second call returns the imported account
      mockGetAccount.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'imported' });
      mockImportAccountById.mockResolvedValue(undefined);
      mockFromAccount.mockReturnValue({
        decimals: () => 6,
        symbol: () => ({ toString: () => 'IMPORTED' })
      });

      const result = await fetchTokenMetadata('new-asset-id', MIDEN_NETWORK_NAME.TESTNET);

      // First: try IndexedDB
      expect(mockGetAccount).toHaveBeenNthCalledWith(1, 'new-asset-id');
      // Then: network fetch because IndexedDB returned null
      expect(mockImportAccountById).toHaveBeenCalledWith('new-asset-id');
      // Finally: read the imported account
      expect(mockGetAccount).toHaveBeenNthCalledWith(2, 'new-asset-id');
      // Should return actual metadata from imported account, not default
      expect(result.base.symbol).toBe('IMPORTED');
      expect(result.base.decimals).toBe(6);
    });
  });

  describe('NotFoundTokenMetadata', () => {
    it('has correct name and message', () => {
      const error = new NotFoundTokenMetadata();

      expect(error.name).toBe('NotFoundTokenMetadata');
      expect(error.message).toBe("Metadata for token doesn't found");
      expect(error).toBeInstanceOf(Error);
    });
  });
});
