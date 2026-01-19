import { renderHook, act } from '@testing-library/react';

import { AnalyticsEventCategory } from 'lib/miden/analytics-types';

import { useFormAnalytics } from './use-form-analytics.hook';

// Mock useAnalytics
const mockTrackEvent = jest.fn();

jest.mock('./use-analytics.hook', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
    pageEvent: jest.fn(),
    performanceEvent: jest.fn()
  })
}));

describe('useFormAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns form analytics functions', () => {
    const { result } = renderHook(() => useFormAnalytics('login-form'));

    expect(typeof result.current.trackChange).toBe('function');
    expect(typeof result.current.trackSubmit).toBe('function');
    expect(typeof result.current.trackSubmitSuccess).toBe('function');
    expect(typeof result.current.trackSubmitFail).toBe('function');
  });

  describe('trackChange', () => {
    it('tracks form changes with old and new values', () => {
      const { result } = renderHook(() => useFormAnalytics('login-form'));
      const oldValues = { email: '' };
      const newValues = { email: 'test@example.com' };

      act(() => {
        result.current.trackChange(oldValues, newValues);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('login-form', AnalyticsEventCategory.FormChange, {
        oldValues,
        newValues
      });
    });
  });

  describe('trackSubmit', () => {
    it('tracks form submit without properties', () => {
      const { result } = renderHook(() => useFormAnalytics('login-form'));

      act(() => {
        result.current.trackSubmit();
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('login-form', AnalyticsEventCategory.FormSubmit, undefined);
    });

    it('tracks form submit with properties', () => {
      const { result } = renderHook(() => useFormAnalytics('login-form'));
      const properties = { method: 'password' };

      act(() => {
        result.current.trackSubmit(properties);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('login-form', AnalyticsEventCategory.FormSubmit, properties);
    });
  });

  describe('trackSubmitSuccess', () => {
    it('tracks form submit success without properties', () => {
      const { result } = renderHook(() => useFormAnalytics('login-form'));

      act(() => {
        result.current.trackSubmitSuccess();
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('login-form', AnalyticsEventCategory.FormSubmitSuccess, undefined);
    });

    it('tracks form submit success with properties', () => {
      const { result } = renderHook(() => useFormAnalytics('login-form'));
      const properties = { duration: 1000 };

      act(() => {
        result.current.trackSubmitSuccess(properties);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('login-form', AnalyticsEventCategory.FormSubmitSuccess, properties);
    });
  });

  describe('trackSubmitFail', () => {
    it('tracks form submit failure without properties', () => {
      const { result } = renderHook(() => useFormAnalytics('login-form'));

      act(() => {
        result.current.trackSubmitFail();
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('login-form', AnalyticsEventCategory.FormSubmitFail, undefined);
    });

    it('tracks form submit failure with error properties', () => {
      const { result } = renderHook(() => useFormAnalytics('login-form'));
      const properties = { error: 'Invalid credentials' };

      act(() => {
        result.current.trackSubmitFail(properties);
      });

      expect(mockTrackEvent).toHaveBeenCalledWith('login-form', AnalyticsEventCategory.FormSubmitFail, properties);
    });
  });

  it('memoizes the return value', () => {
    const { result, rerender } = renderHook(() => useFormAnalytics('login-form'));

    const firstResult = result.current;
    rerender();
    const secondResult = result.current;

    expect(firstResult).toBe(secondResult);
  });
});
