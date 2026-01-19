import { renderHook, act } from '@testing-library/react';

import { useAnalytics } from './use-analytics.hook';

// Mock dependencies
const mockSendTrackEvent = jest.fn();
const mockSendPageEvent = jest.fn();
const mockSendPerformanceEvent = jest.fn();
let mockAnalyticsState = { enabled: true, userId: 'test-user' };
const mockRpc = 'https://rpc.example.com';

jest.mock('./use-analytics-state.hook', () => ({
  useAnalyticsState: () => ({
    analyticsState: mockAnalyticsState,
    setAnalyticsState: jest.fn()
  }),
  sendTrackEvent: (...args: unknown[]) => mockSendTrackEvent(...args),
  sendPageEvent: (...args: unknown[]) => mockSendPageEvent(...args),
  sendPerformanceEvent: (...args: unknown[]) => mockSendPerformanceEvent(...args)
}));

jest.mock('./use-analytics-network.hook', () => ({
  useAnalyticsNetwork: () => mockRpc
}));

import { AnalyticsEventCategory } from 'lib/miden/analytics-types';

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAnalyticsState = { enabled: true, userId: 'test-user' };
    mockSendTrackEvent.mockResolvedValue(undefined);
    mockSendPageEvent.mockResolvedValue(undefined);
    mockSendPerformanceEvent.mockResolvedValue(undefined);
  });

  describe('trackEvent', () => {
    it('sends track event when analytics is enabled', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.trackEvent('button_click', AnalyticsEventCategory.ButtonPress, { button: 'submit' });
      });

      expect(mockSendTrackEvent).toHaveBeenCalledWith(
        'test-user',
        mockRpc,
        'button_click',
        AnalyticsEventCategory.ButtonPress,
        { button: 'submit' }
      );
    });

    it('uses General category by default', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.trackEvent('some_event');
      });

      expect(mockSendTrackEvent).toHaveBeenCalledWith(
        'test-user',
        mockRpc,
        'some_event',
        AnalyticsEventCategory.General,
        undefined
      );
    });

    it('does not send event when analytics is disabled', async () => {
      mockAnalyticsState.enabled = false;

      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        result.current.trackEvent('button_click');
      });

      expect(mockSendTrackEvent).not.toHaveBeenCalled();
    });

    it('allows overriding analytics enabled check', async () => {
      mockAnalyticsState.enabled = false;

      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.trackEvent('button_click', AnalyticsEventCategory.General, undefined, true);
      });

      expect(mockSendTrackEvent).toHaveBeenCalled();
    });
  });

  describe('pageEvent', () => {
    it('sends page event when analytics is enabled', async () => {
      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        await result.current.pageEvent('/home', '?tab=settings', { referrer: '/login' });
      });

      expect(mockSendPageEvent).toHaveBeenCalledWith('test-user', mockRpc, '/home', '?tab=settings', {
        referrer: '/login'
      });
    });

    it('does not send event when analytics is disabled', async () => {
      mockAnalyticsState.enabled = false;

      const { result } = renderHook(() => useAnalytics());

      await act(async () => {
        result.current.pageEvent('/home', '');
      });

      expect(mockSendPageEvent).not.toHaveBeenCalled();
    });
  });

  describe('performanceEvent', () => {
    it('sends performance event when analytics is enabled', async () => {
      const { result } = renderHook(() => useAnalytics());
      const timings = { start: 0, end: 1000 };

      await act(async () => {
        await result.current.performanceEvent('page_load', timings, { route: '/home' });
      });

      expect(mockSendPerformanceEvent).toHaveBeenCalledWith('test-user', mockRpc, 'page_load', timings, {
        route: '/home'
      });
    });

    it('does not send event when analytics is disabled', async () => {
      mockAnalyticsState.enabled = false;

      const { result } = renderHook(() => useAnalytics());
      const timings = { start: 0, end: 1000 };

      await act(async () => {
        result.current.performanceEvent('page_load', timings);
      });

      expect(mockSendPerformanceEvent).not.toHaveBeenCalled();
    });
  });
});
