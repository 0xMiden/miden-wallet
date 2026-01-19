import { renderHook } from '@testing-library/react';

import { usePageRouterAnalytics } from './use-page-router-analytics.hook';

// Mock useAnalytics
const mockPageEvent = jest.fn();

jest.mock('./use-analytics.hook', () => ({
  useAnalytics: () => ({
    trackEvent: jest.fn(),
    pageEvent: mockPageEvent,
    performanceEvent: jest.fn()
  })
}));

describe('usePageRouterAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tracks welcome page when at root and context not ready', () => {
    renderHook(() => usePageRouterAnalytics('/', '', false));

    expect(mockPageEvent).toHaveBeenCalledWith('/welcome', '');
  });

  it('tracks regular page event for simple paths', () => {
    renderHook(() => usePageRouterAnalytics('/settings', '', true));

    expect(mockPageEvent).toHaveBeenCalledWith('/settings', '');
  });

  it('tracks explore page with token info', () => {
    renderHook(() => usePageRouterAnalytics('/explore/token123_5', '', true));

    expect(mockPageEvent).toHaveBeenCalledWith('/explore', '', {
      tokenAddress: 'token123',
      tokenId: '5'
    });
  });

  it('tracks explore page with default token id', () => {
    renderHook(() => usePageRouterAnalytics('/explore/token123', '', true));

    expect(mockPageEvent).toHaveBeenCalledWith('/explore', '', {
      tokenAddress: 'token123',
      tokenId: '0'
    });
  });

  it('tracks send page with token info', () => {
    renderHook(() => usePageRouterAnalytics('/send/mytoken_10', '', true));

    expect(mockPageEvent).toHaveBeenCalledWith('/send', '', {
      tokenAddress: 'mytoken',
      tokenId: '10'
    });
  });

  it('tracks collectible page with token info', () => {
    renderHook(() => usePageRouterAnalytics('/collectible/nft123_1', '', true));

    expect(mockPageEvent).toHaveBeenCalledWith('/collectible', '', {
      tokenAddress: 'nft123',
      tokenId: '1'
    });
  });

  it('tracks swap page with query parameters', () => {
    renderHook(() => usePageRouterAnalytics('/swap', '?from=btc&to=eth', true));

    expect(mockPageEvent).toHaveBeenCalledWith('/swap', '?from=btc&to=eth', {
      inputAssetSlug: 'btc',
      outputAssetSlug: 'eth'
    });
  });

  it('uses default input asset for swap when not provided', () => {
    renderHook(() => usePageRouterAnalytics('/swap', '?to=eth', true));

    expect(mockPageEvent).toHaveBeenCalledWith('/swap', '?to=eth', {
      inputAssetSlug: 'aleo',
      outputAssetSlug: 'eth'
    });
  });

  it('handles swap with no output asset', () => {
    renderHook(() => usePageRouterAnalytics('/swap', '', true));

    expect(mockPageEvent).toHaveBeenCalledWith('/swap', '', {
      inputAssetSlug: 'aleo',
      outputAssetSlug: null
    });
  });

  it('re-tracks when pathname changes', () => {
    const { rerender } = renderHook(
      ({ pathname, search, isContextReady }) => usePageRouterAnalytics(pathname, search, isContextReady),
      { initialProps: { pathname: '/home', search: '', isContextReady: true } }
    );

    expect(mockPageEvent).toHaveBeenCalledTimes(1);
    expect(mockPageEvent).toHaveBeenCalledWith('/home', '');

    rerender({ pathname: '/settings', search: '', isContextReady: true });

    expect(mockPageEvent).toHaveBeenCalledTimes(2);
    expect(mockPageEvent).toHaveBeenLastCalledWith('/settings', '');
  });

  it('re-tracks when search changes', () => {
    const { rerender } = renderHook(
      ({ pathname, search, isContextReady }) => usePageRouterAnalytics(pathname, search, isContextReady),
      { initialProps: { pathname: '/home', search: '', isContextReady: true } }
    );

    expect(mockPageEvent).toHaveBeenCalledTimes(1);

    rerender({ pathname: '/home', search: '?tab=settings', isContextReady: true });

    expect(mockPageEvent).toHaveBeenCalledTimes(2);
    expect(mockPageEvent).toHaveBeenLastCalledWith('/home', '?tab=settings');
  });
});
