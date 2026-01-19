import { renderHook } from '@testing-library/react';

import useBeforeUnload from './useBeforeUnload';

describe('useBeforeUnload', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('adds beforeunload event listener on mount', () => {
    renderHook(() => useBeforeUnload(true));

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('removes beforeunload event listener on unmount', () => {
    const { unmount } = renderHook(() => useBeforeUnload(true));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('calls event.preventDefault when enabled is true', () => {
    renderHook(() => useBeforeUnload(true));

    const handler = addEventListenerSpy.mock.calls[0][1];
    const mockEvent = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent;

    handler(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('does not call event.preventDefault when enabled is false', () => {
    renderHook(() => useBeforeUnload(false));

    const handler = addEventListenerSpy.mock.calls[0][1];
    const mockEvent = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent;

    handler(mockEvent);

    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('calls additionalAction when provided', () => {
    const additionalAction = jest.fn();
    renderHook(() => useBeforeUnload(true, additionalAction));

    const handler = addEventListenerSpy.mock.calls[0][1];
    const mockEvent = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent;

    handler(mockEvent);

    expect(additionalAction).toHaveBeenCalled();
  });

  it('calls additionalAction even when enabled is false', () => {
    const additionalAction = jest.fn();
    renderHook(() => useBeforeUnload(false, additionalAction));

    const handler = addEventListenerSpy.mock.calls[0][1];
    const mockEvent = { preventDefault: jest.fn() } as unknown as BeforeUnloadEvent;

    handler(mockEvent);

    expect(additionalAction).toHaveBeenCalled();
    expect(mockEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('re-attaches listener when enabled changes', () => {
    const { rerender } = renderHook(({ enabled }) => useBeforeUnload(enabled), {
      initialProps: { enabled: false }
    });

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

    rerender({ enabled: true });

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
  });

  it('re-attaches listener when additionalAction changes', () => {
    const action1 = jest.fn();
    const action2 = jest.fn();

    const { rerender } = renderHook(({ action }) => useBeforeUnload(true, action), {
      initialProps: { action: action1 }
    });

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

    rerender({ action: action2 });

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
  });
});
