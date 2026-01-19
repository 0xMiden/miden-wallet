/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import React from 'react';

import Redirect from './Redirect';

jest.mock('lib/woozie/history', () => ({
  createUrl: (pathname = '/', search = '', hash = '') => `${pathname}${search}${hash}`,
  changeState: jest.fn(),
  HistoryAction: { Push: 'pushstate', Replace: 'replacestate' }
}));

jest.mock('lib/woozie/location', () => ({
  createLocationState: () => ({
    pathname: '/',
    search: '',
    hash: ''
  }),
  createLocationUpdates: (to: any) => {
    if (typeof to === 'string') return { pathname: to, search: '', hash: '', state: undefined };
    if (typeof to === 'function') return to({ pathname: '/', search: '', hash: '' });
    return { ...to, state: to.state };
  }
}));

import { changeState, HistoryAction } from 'lib/woozie/history';

describe('Redirect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to string path', () => {
    render(<Redirect to="/target" />);

    expect(changeState).toHaveBeenCalledWith(HistoryAction.Replace, undefined, '/target');
  });

  it('uses Replace action by default', () => {
    render(<Redirect to="/page" />);

    expect(changeState).toHaveBeenCalledWith(HistoryAction.Replace, undefined, expect.any(String));
  });

  it('uses Push action when push prop is true', () => {
    render(<Redirect to="/pushed" push />);

    expect(changeState).toHaveBeenCalledWith(HistoryAction.Push, undefined, '/pushed');
  });

  it('returns null by default', () => {
    const { container } = render(<Redirect to="/test" />);

    expect(container.firstChild).toBeNull();
  });

  it('returns fallback element when provided', () => {
    render(<Redirect to="/test" fallback={<div data-testid="loading">Loading...</div>} />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles object destination', () => {
    render(<Redirect to={{ pathname: '/new', search: '?q=1', hash: '#section' }} />);

    expect(changeState).toHaveBeenCalled();
  });

  it('handles function destination', () => {
    const toFn = (loc: any) => ({ pathname: '/dynamic' + loc.pathname });
    render(<Redirect to={toFn} />);

    expect(changeState).toHaveBeenCalled();
  });

  it('passes state from destination', () => {
    render(<Redirect to={{ pathname: '/stateful', state: { data: 'test' } }} />);

    expect(changeState).toHaveBeenCalledWith(HistoryAction.Replace, { data: 'test' }, expect.any(String));
  });
});
