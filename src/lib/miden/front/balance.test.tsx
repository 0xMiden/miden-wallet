/* eslint-disable import/first */
// Mock the SDK to avoid WASM initialization in Jest
jest.mock('@miden-sdk/react', () => ({
  useAccount: jest.fn(() => ({ assets: [], isLoading: false, refetch: jest.fn() }))
}));

import { useAllBalances, TokenBalanceData } from './balance';

describe('useAllBalances', () => {
  it('exports useAllBalances function', () => {
    expect(typeof useAllBalances).toBe('function');
  });

  it('exports TokenBalanceData type (compile-time check)', () => {
    // Type-level test: ensure the interface shape is correct
    const data: TokenBalanceData = {
      tokenId: 'id',
      tokenSlug: 'slug',
      metadata: { name: 'Test', symbol: 'TST', decimals: 8 },
      balance: 0,
      fiatPrice: 0
    };
    expect(data.tokenId).toBe('id');
  });
});
