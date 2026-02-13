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

jest.mock('lib/platform', () => ({
  isExtension: jest.fn(() => true)
}));

// Mock Repo.faucetMetadatas (IndexedDB / Dexie)
const mockFaucetMetadatasGet = jest.fn();
jest.mock('lib/miden/repo', () => ({
  faucetMetadatas: {
    get: (...args: unknown[]) => mockFaucetMetadatasGet(...args)
  }
}));

// Mock @miden-sdk/miden-sdk: RpcClient, Endpoint, Address, BasicFungibleFaucetComponent
const mockGetAccountDetails = jest.fn();
const mockRpcClient = jest.fn(() => ({
  getAccountDetails: mockGetAccountDetails
}));
const mockFromBech32 = jest.fn();
const mockFromAccount = jest.fn();

jest.mock('@miden-sdk/miden-sdk', () => ({
  RpcClient: function (...args: unknown[]) {
    return mockRpcClient();
  },
  Endpoint: {
    testnet: jest.fn(() => 'testnet-endpoint')
  },
  Address: {
    fromBech32: (...args: unknown[]) => mockFromBech32(...args)
  },
  BasicFungibleFaucetComponent: {
    fromAccount: (account: unknown) => mockFromAccount(account)
  }
}));

const mockIsMidenAsset = isMidenAsset as unknown as jest.Mock;

describe('metadata/fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFaucetMetadatasGet.mockReset();
    mockGetAccountDetails.mockReset();
    mockFromBech32.mockReset();
    mockFromAccount.mockReset();
  });

  describe('fetchTokenMetadata', () => {
    it('returns MIDEN_METADATA for miden asset', async () => {
      mockIsMidenAsset.mockReturnValue(true);

      const result = await fetchTokenMetadata('miden');

      expect(result).toEqual({
        base: MIDEN_METADATA,
        detailed: MIDEN_METADATA
      });
      // Should not call any SDK or repo methods for miden asset
      expect(mockFaucetMetadatasGet).not.toHaveBeenCalled();
      expect(mockGetAccountDetails).not.toHaveBeenCalled();
    });

    it('returns cached metadata from IndexedDB (Repo) for non-miden assets', async () => {
      mockIsMidenAsset.mockReturnValue(false);
      mockFaucetMetadatasGet.mockResolvedValue({
        decimals: 8,
        symbol: 'TEST'
      });

      const result = await fetchTokenMetadata('test-asset-id');

      expect(result.base).toEqual({
        decimals: 8,
        symbol: 'TEST',
        name: 'TEST',
        shouldPreferSymbol: true,
        thumbnailUri: 'chrome-extension://test-id/misc/token-logos/default.svg'
      });
      expect(result.detailed).toEqual(result.base);
      // Should NOT call RPC when cached locally
      expect(mockGetAccountDetails).not.toHaveBeenCalled();
    });

    it('fetches metadata via RpcClient when not cached in IndexedDB', async () => {
      mockIsMidenAsset.mockReturnValue(false);
      mockFaucetMetadatasGet.mockResolvedValue(undefined);

      const mockAccountId = 'account-id-123';
      mockFromBech32.mockReturnValue({ accountId: () => mockAccountId });

      const mockUnderlyingAccount = { id: 'underlying' };
      mockGetAccountDetails.mockResolvedValue({
        account: () => mockUnderlyingAccount,
        isPublic: () => true
      });

      mockFromAccount.mockReturnValue({
        decimals: () => 6,
        symbol: () => ({ toString: () => 'RPC_TOKEN' })
      });

      const result = await fetchTokenMetadata('rpc-asset-id');

      expect(mockFaucetMetadatasGet).toHaveBeenCalledWith('rpc-asset-id');
      expect(mockFromBech32).toHaveBeenCalledWith('rpc-asset-id');
      expect(mockGetAccountDetails).toHaveBeenCalledWith(mockAccountId);
      expect(result.base).toEqual({
        decimals: 6,
        symbol: 'RPC_TOKEN',
        name: 'RPC_TOKEN',
        shouldPreferSymbol: true,
        thumbnailUri: 'chrome-extension://test-id/misc/token-logos/default.svg'
      });
      expect(result.detailed).toEqual(result.base);
    });

    it('returns DEFAULT_TOKEN_METADATA when RPC returns no underlying account (private)', async () => {
      mockIsMidenAsset.mockReturnValue(false);
      mockFaucetMetadatasGet.mockResolvedValue(undefined);
      mockFromBech32.mockReturnValue({ accountId: () => 'acc-id' });
      mockGetAccountDetails.mockResolvedValue({
        account: () => null,
        isPublic: () => false
      });

      const result = await fetchTokenMetadata('private-asset-id');

      expect(result).toEqual({
        base: DEFAULT_TOKEN_METADATA,
        detailed: DEFAULT_TOKEN_METADATA
      });
    });

    it('returns DEFAULT_TOKEN_METADATA when RPC returns no underlying account (public, warns)', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockIsMidenAsset.mockReturnValue(false);
      mockFaucetMetadatasGet.mockResolvedValue(undefined);
      mockFromBech32.mockReturnValue({ accountId: () => 'acc-id' });
      mockGetAccountDetails.mockResolvedValue({
        account: () => null,
        isPublic: () => true
      });

      const result = await fetchTokenMetadata('public-missing-asset-id');

      expect(result).toEqual({
        base: DEFAULT_TOKEN_METADATA,
        detailed: DEFAULT_TOKEN_METADATA
      });
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to fetch metadata from chain for',
        'public-missing-asset-id',
        'Using default metadata'
      );
      consoleWarnSpy.mockRestore();
    });

    it('returns DEFAULT_TOKEN_METADATA when RPC call fails', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockIsMidenAsset.mockReturnValue(false);
      mockFaucetMetadatasGet.mockResolvedValue(undefined);
      mockFromBech32.mockReturnValue({ accountId: () => 'acc-id' });
      mockGetAccountDetails.mockRejectedValue(new Error('RPC error'));

      const result = await fetchTokenMetadata('rpc-fail-asset-id');

      expect(result).toEqual({
        base: DEFAULT_TOKEN_METADATA,
        detailed: DEFAULT_TOKEN_METADATA
      });
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('throws NotFoundTokenMetadata on unexpected error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockIsMidenAsset.mockReturnValue(false);
      mockFaucetMetadatasGet.mockRejectedValue(new Error('Unexpected DB error'));

      await expect(fetchTokenMetadata('bad-asset-id')).rejects.toThrow(NotFoundTokenMetadata);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('IndexedDB-first loading optimization', () => {
    it('reads from IndexedDB (Repo.faucetMetadatas) BEFORE any RPC fetch', async () => {
      mockIsMidenAsset.mockReturnValue(false);

      const callOrder: string[] = [];
      mockFaucetMetadatasGet.mockImplementation(async () => {
        callOrder.push('faucetMetadatas.get');
        return { decimals: 6, symbol: 'CACHED' };
      });
      mockGetAccountDetails.mockImplementation(async () => {
        callOrder.push('rpcClient.getAccountDetails');
        return { account: () => ({ id: 'rpc' }), isPublic: () => true };
      });

      await fetchTokenMetadata('some-asset-id');

      // IndexedDB read must be called FIRST
      expect(callOrder[0]).toBe('faucetMetadatas.get');
      // RPC should NOT be called at all if cached in IndexedDB
      expect(callOrder).not.toContain('rpcClient.getAccountDetails');
    });

    it('skips RPC fetch when metadata exists in IndexedDB', async () => {
      mockIsMidenAsset.mockReturnValue(false);
      mockFaucetMetadatasGet.mockResolvedValue({
        decimals: 8,
        symbol: 'FAST'
      });

      await fetchTokenMetadata('cached-asset-id');

      // Should read from IndexedDB
      expect(mockFaucetMetadatasGet).toHaveBeenCalledWith('cached-asset-id');
      // RPC should NOT be called (no network fetch needed)
      expect(mockGetAccountDetails).not.toHaveBeenCalled();
    });

    it('only fetches from RPC when metadata is NOT in IndexedDB', async () => {
      mockIsMidenAsset.mockReturnValue(false);
      // Not cached
      mockFaucetMetadatasGet.mockResolvedValue(undefined);
      mockFromBech32.mockReturnValue({ accountId: () => 'acc-id' });

      const mockUnderlyingAccount = { id: 'rpc-account' };
      mockGetAccountDetails.mockResolvedValue({
        account: () => mockUnderlyingAccount,
        isPublic: () => true
      });
      mockFromAccount.mockReturnValue({
        decimals: () => 6,
        symbol: () => ({ toString: () => 'FETCHED' })
      });

      const result = await fetchTokenMetadata('new-asset-id');

      // First: try IndexedDB
      expect(mockFaucetMetadatasGet).toHaveBeenCalledWith('new-asset-id');
      // Then: RPC fetch because IndexedDB had nothing
      expect(mockGetAccountDetails).toHaveBeenCalledWith('acc-id');
      // Should return actual metadata from RPC, not default
      expect(result.base.symbol).toBe('FETCHED');
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
