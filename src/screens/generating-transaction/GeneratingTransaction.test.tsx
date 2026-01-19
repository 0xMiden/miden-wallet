import React from 'react';

import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { GeneratingTransactionPage } from './GeneratingTransaction';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

jest.mock('app/atoms/CircularProgress', () => () => null);
jest.mock('components/Alert', () => ({ Alert: () => null, AlertVariant: { Warning: 'Warning' } }));
jest.mock('components/Button', () => ({ Button: () => null, ButtonVariant: {} }));
jest.mock('app/icons/v2', () => ({
  Icon: () => null,
  IconName: { Success: 'Success', Failed: 'Failed', InProgress: 'InProgress' }
}));

jest.mock('app/hooks/useBeforeUnload', () => ({
  __esModule: true,
  default: () => undefined
}));

jest.mock('app/env', () => ({
  closeLoadingFullPage: jest.fn()
}));

jest.mock('lib/woozie', () => ({
  navigate: jest.fn()
}));

jest.mock('lib/settings/helpers', () => ({
  isAutoCloseEnabled: () => false
}));

jest.mock('lib/analytics', () => ({
  useAnalytics: () => ({ pageEvent: jest.fn(), trackEvent: jest.fn() })
}));

jest.mock('lib/miden/front', () => ({
  useMidenContext: () => ({ signTransaction: jest.fn() })
}));

const mutateTxMock = jest.fn();
jest.mock('lib/swr', () => ({
  useRetryableSWR: () => ({ data: [], mutate: mutateTxMock })
}));

const safeGenerateTransactionsLoopMock = jest.fn();
jest.mock('lib/miden/activity', () => ({
  safeGenerateTransactionsLoop: (...args: any[]) => safeGenerateTransactionsLoopMock(...args),
  getAllUncompletedTransactions: jest.fn(async () => [])
}));

jest.mock('lib/miden/activity/notes', () => ({
  useExportNotes: () => [[], jest.fn()]
}));

describe('GeneratingTransactionPage interval cleanup', () => {
  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
  });

  beforeEach(() => {
    jest.useFakeTimers();
    mutateTxMock.mockClear();
    safeGenerateTransactionsLoopMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('clears the polling interval when the transaction loop reports failure', async () => {
    safeGenerateTransactionsLoopMock.mockReturnValue(false);
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GeneratingTransactionPage />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(setIntervalSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();

    const callsBefore = safeGenerateTransactionsLoopMock.mock.calls.length;
    act(() => {
      jest.advanceTimersByTime(30_000);
    });
    expect(safeGenerateTransactionsLoopMock.mock.calls.length).toBe(callsBefore);

    act(() => root.unmount());
  });

  it('clears the polling interval when the transaction loop throws', async () => {
    safeGenerateTransactionsLoopMock.mockImplementation(() => {
      throw new Error('boom');
    });
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GeneratingTransactionPage />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(setIntervalSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();

    const callsBefore = safeGenerateTransactionsLoopMock.mock.calls.length;
    act(() => {
      jest.advanceTimersByTime(30_000);
    });
    expect(safeGenerateTransactionsLoopMock.mock.calls.length).toBe(callsBefore);

    act(() => root.unmount());
  });

  it('clears the polling interval on unmount', async () => {
    safeGenerateTransactionsLoopMock.mockReturnValue(true);
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(<GeneratingTransactionPage />);
    });

    act(() => root.unmount());
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
