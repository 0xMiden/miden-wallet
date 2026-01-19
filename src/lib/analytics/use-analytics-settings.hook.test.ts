import { renderHook, act } from '@testing-library/react';

import { useAnalyticsSettings } from './use-analytics-settings.hook';

// Mock useAnalyticsState
const mockSetAnalyticsState = jest.fn();
let mockAnalyticsState = { enabled: undefined as boolean | undefined, userId: 'test-user' };

jest.mock('./use-analytics-state.hook', () => ({
  useAnalyticsState: () => ({
    analyticsState: mockAnalyticsState,
    setAnalyticsState: mockSetAnalyticsState
  })
}));

describe('useAnalyticsSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsState = { enabled: undefined, userId: 'test-user' };
  });

  it('returns analytics enabled state', () => {
    mockAnalyticsState.enabled = true;

    const { result } = renderHook(() => useAnalyticsSettings());

    expect(result.current.analyticsEnabled).toBe(true);
  });

  it('returns undefined when analytics not set', () => {
    mockAnalyticsState.enabled = undefined;

    const { result } = renderHook(() => useAnalyticsSettings());

    expect(result.current.analyticsEnabled).toBeUndefined();
  });

  it('provides setAnalyticsEnabled function', () => {
    const { result } = renderHook(() => useAnalyticsSettings());

    expect(typeof result.current.setAnalyticsEnabled).toBe('function');
  });

  it('calls setAnalyticsState with enabled true', () => {
    const { result } = renderHook(() => useAnalyticsSettings());

    act(() => {
      result.current.setAnalyticsEnabled(true);
    });

    expect(mockSetAnalyticsState).toHaveBeenCalledWith({
      ...mockAnalyticsState,
      enabled: true
    });
  });

  it('calls setAnalyticsState with enabled false', () => {
    mockAnalyticsState.enabled = true;

    const { result } = renderHook(() => useAnalyticsSettings());

    act(() => {
      result.current.setAnalyticsEnabled(false);
    });

    expect(mockSetAnalyticsState).toHaveBeenCalledWith({
      ...mockAnalyticsState,
      enabled: false
    });
  });

  it('calls setAnalyticsState with enabled undefined', () => {
    mockAnalyticsState.enabled = true;

    const { result } = renderHook(() => useAnalyticsSettings());

    act(() => {
      result.current.setAnalyticsEnabled(undefined);
    });

    expect(mockSetAnalyticsState).toHaveBeenCalledWith({
      ...mockAnalyticsState,
      enabled: undefined
    });
  });
});
