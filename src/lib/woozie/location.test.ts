/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import React from 'react';

import { createLocationState, createLocationUpdates, LocationProvider, useLocation, LocationState } from './location';

describe('woozie location', () => {
  describe('createLocationState', () => {
    it('returns location state from window', () => {
      const state = createLocationState();

      expect(state).toHaveProperty('pathname');
      expect(state).toHaveProperty('search');
      expect(state).toHaveProperty('hash');
      expect(state).toHaveProperty('state');
      expect(state).toHaveProperty('trigger');
      expect(state).toHaveProperty('historyLength');
      expect(state).toHaveProperty('historyPosition');
      expect(state).toHaveProperty('host');
      expect(state).toHaveProperty('hostname');
      expect(state).toHaveProperty('href');
      expect(state).toHaveProperty('origin');
      expect(state).toHaveProperty('port');
      expect(state).toHaveProperty('protocol');
    });

    it('returns valid pathname', () => {
      const state = createLocationState();
      expect(typeof state.pathname).toBe('string');
      expect(state.pathname.startsWith('/') || state.pathname === '').toBe(true);
    });

    it('returns historyLength as number', () => {
      const state = createLocationState();
      expect(typeof state.historyLength).toBe('number');
      expect(state.historyLength).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createLocationUpdates', () => {
    const mockLocation: LocationState = {
      pathname: '/current',
      search: '?q=test',
      hash: '#section',
      state: { data: 'test' },
      trigger: null,
      historyLength: 5,
      historyPosition: 2,
      host: 'localhost',
      hostname: 'localhost',
      href: 'http://localhost/current?q=test#section',
      origin: 'http://localhost',
      port: '',
      protocol: 'http:'
    };

    it('handles string path', () => {
      const updates = createLocationUpdates('/new-path', mockLocation);
      expect(updates).toEqual({ pathname: '/new-path' });
    });

    it('handles object updates', () => {
      const updates = createLocationUpdates({ pathname: '/new', search: '?new=1' }, mockLocation);
      expect(updates).toEqual({ pathname: '/new', search: '?new=1' });
    });

    it('handles function modifier', () => {
      const modifier = (loc: LocationState) => ({
        pathname: loc.pathname + '/child',
        search: loc.search + '&extra=1'
      });

      const updates = createLocationUpdates(modifier, mockLocation);
      expect(updates).toEqual({
        pathname: '/current/child',
        search: '?q=test&extra=1'
      });
    });

    it('passes location state to modifier function', () => {
      const modifier = jest.fn((loc: LocationState) => ({ pathname: loc.pathname }));

      createLocationUpdates(modifier, mockLocation);

      expect(modifier).toHaveBeenCalledWith(mockLocation);
    });
  });

  describe('LocationProvider and useLocation', () => {
    it('provides location context', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) =>
        React.createElement(LocationProvider, null, children);

      const { result } = renderHook(() => useLocation(), { wrapper });

      expect(result.current).toHaveProperty('pathname');
      expect(result.current).toHaveProperty('search');
      expect(result.current).toHaveProperty('hash');
    });
  });
});
