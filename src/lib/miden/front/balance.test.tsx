import '../../../../test/jest-mocks';

import React, { useEffect } from 'react';

import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { useWalletStore } from 'lib/store';

import { useAllBalances, getAllBalanceSWRKey } from './balance';

// Track concurrent calls to detect WASM client abuse
let concurrentCalls = 0;
let maxConcurrentCalls = 0;

// Mock fetchBalances to track concurrent calls
jest.mock('lib/store/utils/fetchBalances', () => ({
  fetchBalances: jest.fn(async () => {
    concurrentCalls++;
    maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 50));
    concurrentCalls--;
    return [];
  })
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
    // Reset concurrent call tracking
    concurrentCalls = 0;
    maxConcurrentCalls = 0;
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
            {
              tokenId: 't1',
              tokenSlug: 'test',
              metadata: { name: 'Test', symbol: 'T', decimals: 18 },
              balance: 100,
              fiatPrice: 1
            }
          ]
        }
      });
    });

    // Should have rendered a few more times, but not infinitely
    expect(renderCount - initialCount).toBeLessThan(5);
  });

  it('multiple components should not trigger concurrent fetches for same address', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    // Multiple components using useAllBalances with the same address
    const BalanceConsumer1 = () => {
      const { data } = useAllBalances('same-address', {});
      return <div data-id="1" data-count={data.length} />;
    };

    const BalanceConsumer2 = () => {
      const { data } = useAllBalances('same-address', {});
      return <div data-id="2" data-count={data.length} />;
    };

    const BalanceConsumer3 = () => {
      const { data } = useAllBalances('same-address', {});
      return <div data-id="3" data-count={data.length} />;
    };

    await act(async () => {
      root.render(
        <>
          <BalanceConsumer1 />
          <BalanceConsumer2 />
          <BalanceConsumer3 />
        </>
      );
    });

    // Wait for fetches to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Should never have more than 1 concurrent call for the same address
    // This prevents "recursive use of an object" errors in WASM client
    expect(maxConcurrentCalls).toBeLessThanOrEqual(1);
  });
});

describe('getAllBalanceSWRKey', () => {
  it('returns correctly formatted SWR key', () => {
    const key = getAllBalanceSWRKey('test-address-123');
    expect(key).toBe('allBalance_test-address-123');
  });

  it('handles different address formats', () => {
    expect(getAllBalanceSWRKey('0xabc123')).toBe('allBalance_0xabc123');
    expect(getAllBalanceSWRKey('')).toBe('allBalance_');
    expect(getAllBalanceSWRKey('very-long-address-string-here')).toBe('allBalance_very-long-address-string-here');
  });
});
