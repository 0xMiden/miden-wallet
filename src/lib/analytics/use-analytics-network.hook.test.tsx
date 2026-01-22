import { renderHook } from '@testing-library/react';
import React from 'react';

import { CustomRpsContext } from './custom-rpc.context';
import { useAnalyticsNetwork } from './use-analytics-network.hook';

describe('useAnalyticsNetwork', () => {
  it('returns the context value', () => {
    const mockContextValue = { rpcUrl: 'https://example.com' };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <CustomRpsContext.Provider value={mockContextValue as any}>{children}</CustomRpsContext.Provider>
    );

    const { result } = renderHook(() => useAnalyticsNetwork(), { wrapper });

    expect(result.current).toBe(mockContextValue);
  });

  it('returns undefined when no provider', () => {
    const { result } = renderHook(() => useAnalyticsNetwork());

    expect(result.current).toBeUndefined();
  });
});
