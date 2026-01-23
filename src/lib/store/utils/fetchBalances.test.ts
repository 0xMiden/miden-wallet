import '../../../../test/jest-mocks';

import { AssetMetadata, MIDEN_METADATA } from 'lib/miden/metadata';

import { fetchBalances } from './fetchBalances';

// Mock dependencies
const mockGetAccount = jest.fn();
const mockImportAccountById = jest.fn();
const mockSyncState = jest.fn();
const mockGetMidenClient = jest.fn(() => ({
  getAccount: mockGetAccount,
  importAccountById: mockImportAccountById,
  syncState: mockSyncState
}));

jest.mock('lib/miden/sdk/miden-client', () => ({
  getMidenClient: () => mockGetMidenClient(),
  withWasmClientLock: async <T>(operation: () => Promise<T>): Promise<T> => operation()
}));

jest.mock('lib/miden/assets', () => ({
  getFaucetIdSetting: jest.fn(() => 'miden-faucet-id')
}));

jest.mock('lib/miden/sdk/helpers', () => ({
  getBech32AddressFromAccountId: jest.fn((id: string) => `bech32-${id}`)
}));

// Mock BasicFungibleFaucetComponent for inline metadata extraction
const mockFromAccount = jest.fn();
jest.mock('@demox-labs/miden-sdk', () => ({
  BasicFungibleFaucetComponent: {
    fromAccount: (account: unknown) => mockFromAccount(account)
  }
}));

jest.mock('lib/miden/metadata', () => ({
  MIDEN_METADATA: { name: 'Miden', symbol: 'MIDEN', decimals: 8 },
  DEFAULT_TOKEN_METADATA: { name: 'Unknown', symbol: 'Unknown', decimals: 6 },
  getAssetUrl: jest.fn((path: string) => `/${path}`)
}));

jest.mock('../../miden/front/assets', () => ({
  setTokensBaseMetadata: jest.fn()
}));

describe('fetchBalances', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGetAccount.mockReset();
    mockImportAccountById.mockReset();
    mockSyncState.mockReset();
    mockFromAccount.mockReset();
  });

  beforeAll(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it('returns default MIDEN balance when account not found', async () => {
    mockGetAccount.mockResolvedValueOnce(null);

    const result = await fetchBalances('unknown-address', {});

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      tokenId: 'miden-faucet-id',
      tokenSlug: 'MIDEN',
      metadata: MIDEN_METADATA,
      fiatPrice: 1,
      balance: 0
    });
  });

  it('returns balances for account with assets', async () => {
    // Mock so bech32 conversion returns the miden faucet id
    const { getBech32AddressFromAccountId } = jest.requireMock('lib/miden/sdk/helpers');
    getBech32AddressFromAccountId.mockReturnValueOnce('miden-faucet-id');

    const mockAssets = [
      {
        faucetId: () => 'raw-miden-faucet',
        amount: () => ({ toString: () => '100000000' }) // 1 MIDEN (8 decimals)
      }
    ];

    mockGetAccount.mockResolvedValueOnce({
      vault: () => ({
        fungibleAssets: () => mockAssets
      })
    });

    const result = await fetchBalances('my-address', {}, { fetchMissingMetadata: false });

    expect(result).toHaveLength(1);
    expect(result[0].tokenSlug).toBe('MIDEN');
    expect(result[0].balance).toBe(1);
  });

  it('includes zero MIDEN balance if not in vault', async () => {
    const tokenMetadata: AssetMetadata = { name: 'Other Token', symbol: 'OTH', decimals: 6 };
    const mockAssets = [
      {
        faucetId: () => 'other-faucet',
        amount: () => ({ toString: () => '1000000' }) // 1 OTH (6 decimals)
      }
    ];

    mockGetAccount.mockResolvedValueOnce({
      vault: () => ({
        fungibleAssets: () => mockAssets
      })
    });

    const result = await fetchBalances('my-address', { 'bech32-other-faucet': tokenMetadata });

    expect(result).toHaveLength(2);
    // Other token
    expect(result[0].tokenSlug).toBe('OTH');
    expect(result[0].balance).toBe(1);
    // MIDEN with 0 balance
    expect(result[1].tokenSlug).toBe('MIDEN');
    expect(result[1].balance).toBe(0);
  });

  it('skips assets without metadata', async () => {
    const mockAssets = [
      {
        faucetId: () => 'unknown-faucet',
        amount: () => ({ toString: () => '1000000' })
      }
    ];

    mockGetAccount.mockResolvedValueOnce({
      vault: () => ({
        fungibleAssets: () => mockAssets
      })
    });

    const result = await fetchBalances('my-address', {}, { fetchMissingMetadata: false });

    // Only MIDEN default balance (unknown asset skipped)
    expect(result).toHaveLength(1);
    expect(result[0].tokenSlug).toBe('MIDEN');
  });

  it('fetches metadata inline and calls setAssetsMetadata', async () => {
    const mockSetAssetsMetadata = jest.fn();
    const { setTokensBaseMetadata } = jest.requireMock('../../miden/front/assets');

    const mockFaucetAccount = { id: 'faucet-account' };
    const mockAssets = [
      {
        faucetId: () => 'new-faucet',
        amount: () => ({ toString: () => '1000000' })
      }
    ];

    // First call returns user account, second call returns faucet account for metadata
    mockGetAccount
      .mockResolvedValueOnce({
        vault: () => ({
          fungibleAssets: () => mockAssets
        })
      })
      .mockResolvedValueOnce(mockFaucetAccount);

    // Mock the faucet metadata extraction
    mockFromAccount.mockReturnValueOnce({
      decimals: () => 6,
      symbol: () => ({ toString: () => 'NEW' })
    });

    await fetchBalances('my-address', {}, { setAssetsMetadata: mockSetAssetsMetadata });

    // Should fetch faucet account to get metadata
    expect(mockGetAccount).toHaveBeenCalledWith('bech32-new-faucet');
    // Should call setAssetsMetadata with fetched metadata
    expect(mockSetAssetsMetadata).toHaveBeenCalledWith({
      'bech32-new-faucet': expect.objectContaining({
        symbol: 'NEW',
        decimals: 6
      })
    });
    // Should persist metadata
    expect(setTokensBaseMetadata).toHaveBeenCalled();
  });

  it('calls importAccountById when faucet account not found locally', async () => {
    const mockSetAssetsMetadata = jest.fn();
    const mockFaucetAccount = { id: 'faucet-account' };
    const mockAssets = [
      {
        faucetId: () => 'new-faucet',
        amount: () => ({ toString: () => '1000000' })
      }
    ];

    // First call returns user account, second returns null (not found), third returns imported account
    mockGetAccount
      .mockResolvedValueOnce({
        vault: () => ({
          fungibleAssets: () => mockAssets
        })
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockFaucetAccount);

    mockImportAccountById.mockResolvedValueOnce(undefined);

    // Mock the faucet metadata extraction
    mockFromAccount.mockReturnValueOnce({
      decimals: () => 8,
      symbol: () => ({ toString: () => 'IMPORTED' })
    });

    await fetchBalances('my-address', {}, { setAssetsMetadata: mockSetAssetsMetadata });

    // Should try to import the faucet account when not found locally
    expect(mockImportAccountById).toHaveBeenCalledWith('bech32-new-faucet');
    // Should call setAssetsMetadata with imported metadata
    expect(mockSetAssetsMetadata).toHaveBeenCalledWith({
      'bech32-new-faucet': expect.objectContaining({
        symbol: 'IMPORTED',
        decimals: 8
      })
    });
  });

  it('reads from IndexedDB (getAccount) without calling syncState', async () => {
    const mockAssets = [
      {
        faucetId: () => 'raw-miden-faucet',
        amount: () => ({ toString: () => '100000000' })
      }
    ];

    mockGetAccount.mockResolvedValueOnce({
      vault: () => ({
        fungibleAssets: () => mockAssets
      })
    });

    const { getBech32AddressFromAccountId } = jest.requireMock('lib/miden/sdk/helpers');
    getBech32AddressFromAccountId.mockReturnValueOnce('miden-faucet-id');

    await fetchBalances('my-address', {}, { fetchMissingMetadata: false });

    // Should read from IndexedDB
    expect(mockGetAccount).toHaveBeenCalledWith('my-address');
    // Should NOT call syncState - that happens separately via AutoSync
    expect(mockSyncState).not.toHaveBeenCalled();
  });
});
