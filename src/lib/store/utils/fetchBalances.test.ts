import '../../../../test/jest-mocks';

import { AssetMetadata, MIDEN_METADATA } from 'lib/miden/metadata';

import { fetchBalances } from './fetchBalances';

// Mock dependencies
const mockGetAccount = jest.fn();
const mockGetMidenClient = jest.fn(() => ({
  getAccount: mockGetAccount
}));

jest.mock('lib/miden/sdk/miden-client', () => ({
  getMidenClient: () => mockGetMidenClient(),
  withWasmClientLock: async <T>(operation: () => Promise<T>): Promise<T> => operation(),
  runWhenClientIdle: (operation: () => Promise<void>) => {
    // Execute immediately in tests
    void operation();
  }
}));

jest.mock('lib/miden/assets', () => ({
  getFaucetIdSetting: jest.fn(() => 'miden-faucet-id')
}));

jest.mock('lib/miden/sdk/helpers', () => ({
  getBech32AddressFromAccountId: jest.fn((id: string) => `bech32-${id}`)
}));

jest.mock('lib/miden/metadata', () => ({
  fetchTokenMetadata: jest.fn(),
  MIDEN_METADATA: { name: 'Miden', symbol: 'MIDEN', decimals: 8 }
}));

jest.mock('../../miden/front/assets', () => ({
  setTokensBaseMetadata: jest.fn()
}));

describe('fetchBalances', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGetAccount.mockReset();
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

    const result = await fetchBalances('my-address', {}, { prefetchMissingMetadata: false });

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

    const result = await fetchBalances('my-address', {}, { prefetchMissingMetadata: false });

    // Only MIDEN default balance (unknown asset skipped)
    expect(result).toHaveLength(1);
    expect(result[0].tokenSlug).toBe('MIDEN');
  });

  it('calls setAssetsMetadata when provided', async () => {
    const mockSetAssetsMetadata = jest.fn();
    const { fetchTokenMetadata } = jest.requireMock('lib/miden/metadata');
    fetchTokenMetadata.mockResolvedValueOnce({
      base: { name: 'New Token', symbol: 'NEW', decimals: 6 }
    });

    const mockAssets = [
      {
        faucetId: () => 'new-faucet',
        amount: () => ({ toString: () => '1000000' })
      }
    ];

    mockGetAccount.mockResolvedValueOnce({
      vault: () => ({
        fungibleAssets: () => mockAssets
      })
    });

    await fetchBalances('my-address', {}, { setAssetsMetadata: mockSetAssetsMetadata });

    // runWhenClientIdle is mocked to execute immediately, just flush promises
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(fetchTokenMetadata).toHaveBeenCalledWith('bech32-new-faucet');
  });
});
