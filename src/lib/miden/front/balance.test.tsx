import '../../../../test/jest-mocks';

import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { useWalletStore } from 'lib/store';

import { useAllBalances } from './balance';

// Mock fetchBalances to avoid actual API calls
jest.mock('lib/store/utils/fetchBalances', () => ({
  fetchBalances: jest.fn(async () => [])
}));

describe('useAllBalances infinite loop protection', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    // Reset store state before each test
    useWalletStore.setState({
      balances: {},
      balancesLoading: {},
      balancesLastFetched: {},
      assetsMetadata: {}
    });
    jest.clearAllMocks();
  });

  it('useAllBalances should not cause infinite re-renders', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    let renderCount = 0;
    const MAX_RENDERS = 10;

    const BalanceConsumer = () => {
      const { data } = useAllBalances('test-address', {});

      useEffect(() => {
        renderCount++;
        if (renderCount > MAX_RENDERS) {
          throw new Error(`Infinite loop detected: useAllBalances caused ${renderCount} renders`);
        }
      });

      return <div data-balance-count={data.length} />;
    };

    await act(async () => {
      root.render(<BalanceConsumer />);
    });

    // Allow a few renders for initial mount and effects, but not too many
    expect(renderCount).toBeLessThan(MAX_RENDERS);
  });

  it('useAllBalances should return empty array when no balances exist without crashing', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    let finalData: any = null;

    const BalanceConsumer = () => {
      const { data } = useAllBalances('test-address', {});
      finalData = data;
      return <div data-length={data.length} />;
    };

    await act(async () => {
      root.render(<BalanceConsumer />);
    });

    // Wait for effects to settle
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
    });

    // Should return an empty array, not undefined or null
    expect(Array.isArray(finalData)).toBe(true);
    expect(finalData.length).toBe(0);
  });

  it('useAllBalances should not re-render infinitely when tokenMetadatas changes', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    let renderCount = 0;
    const MAX_RENDERS = 15;

    // Component that passes new tokenMetadatas object on each render
    const BalanceConsumerWithChangingMetadata = () => {
      // This creates a new object reference each render - the old bug would cause infinite loop
      const tokenMetadatas = { token1: { name: 'Test', symbol: 'TST', decimals: 18 } };
      const { data } = useAllBalances('test-address', tokenMetadatas);

      useEffect(() => {
        renderCount++;
        if (renderCount > MAX_RENDERS) {
          throw new Error(`Infinite loop detected: ${renderCount} renders with changing tokenMetadatas`);
        }
      });

      return <div data-balance-count={data.length} />;
    };

    await act(async () => {
      root.render(<BalanceConsumerWithChangingMetadata />);
    });

    // Wait for effects to settle
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    expect(renderCount).toBeLessThan(MAX_RENDERS);
  });

  it('useAllBalances should stabilize after store updates', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    let renderCount = 0;

    const BalanceConsumer = () => {
      const { data } = useAllBalances('test-address', {});
      renderCount++;
      return <div data-balance-count={data.length} />;
    };

    await act(async () => {
      root.render(<BalanceConsumer />);
    });

    const initialCount = renderCount;

    // Simulate store update with balances
    await act(async () => {
      useWalletStore.setState({
        balances: {
          'test-address': [
            { tokenId: 't1', tokenSlug: 'test', metadata: { name: 'Test', symbol: 'T', decimals: 18 }, balance: 100, fiatPrice: 1 }
          ]
        }
      });
    });

    // Should have rendered a few more times, but not infinitely
    expect(renderCount - initialCount).toBeLessThan(5);
  });
});
