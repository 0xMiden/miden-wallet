import { renderHook, act } from '@testing-library/react';

import { useSecretState } from './use-secret-state.hook';

describe('useSecretState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('initializes with null', () => {
    const { result } = renderHook(() => useSecretState<string>());
    expect(result.current[0]).toBeNull();
  });

  it('allows setting a secret value', () => {
    const { result } = renderHook(() => useSecretState<string>());

    act(() => {
      result.current[1]('my-secret');
    });

    expect(result.current[0]).toBe('my-secret');
  });

  it('clears secret after 20 seconds', () => {
    const { result } = renderHook(() => useSecretState<string>());

    act(() => {
      result.current[1]('my-secret');
    });

    expect(result.current[0]).toBe('my-secret');

    act(() => {
      jest.advanceTimersByTime(20000);
    });

    expect(result.current[0]).toBeNull();
  });

  it('does not clear before 20 seconds', () => {
    const { result } = renderHook(() => useSecretState<string>());

    act(() => {
      result.current[1]('my-secret');
    });

    act(() => {
      jest.advanceTimersByTime(19999);
    });

    expect(result.current[0]).toBe('my-secret');
  });

  it('resets timer when value changes', () => {
    const { result } = renderHook(() => useSecretState<string>());

    act(() => {
      result.current[1]('secret-1');
    });

    act(() => {
      jest.advanceTimersByTime(15000);
    });

    act(() => {
      result.current[1]('secret-2');
    });

    act(() => {
      jest.advanceTimersByTime(15000);
    });

    // Should still have value since timer was reset
    expect(result.current[0]).toBe('secret-2');

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Now it should be cleared
    expect(result.current[0]).toBeNull();
  });

  it('works with different types', () => {
    const { result } = renderHook(() => useSecretState<{ key: string }>());

    act(() => {
      result.current[1]({ key: 'value' });
    });

    expect(result.current[0]).toEqual({ key: 'value' });
  });
});
