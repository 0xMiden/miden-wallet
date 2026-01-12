import { Sync } from './autoSync';

const mockSyncState = jest.fn();

jest.mock('../sdk/miden-client', () => {
  return {
    getMidenClient: jest.fn(() =>
      Promise.resolve({
        syncState: mockSyncState
      })
    )
  };
});

// Helper to advance time and flush promises in an interleaved way
async function advanceTimeAndFlush(ms: number, steps = 20) {
  const stepMs = ms / steps;
  for (let i = 0; i < steps; i++) {
    jest.advanceTimersByTime(stepMs);
    await Promise.resolve();
    await Promise.resolve(); // Double flush for deeply nested promises
  }
}

describe('AutoSync', () => {
  let sync: Sync;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    sync = new Sync();

    // Mock getCurrentUrl to return localhost by default
    jest.spyOn(sync, 'getCurrentUrl').mockReturnValue('http://localhost');

    let blockNum = 0;
    mockSyncState.mockImplementation(() => {
      blockNum += 1;
      return Promise.resolve({
        blockNum: () => blockNum
      });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start syncing when state is updated from undefined', async () => {
    expect(sync.lastHeight).toBe(0);
    expect(sync.state).toBeUndefined();

    sync.updateState({ status: 'idle' } as any);

    await advanceTimeAndFlush(100);

    expect(mockSyncState).toHaveBeenCalled();
    expect(sync.lastHeight).toBe(1);
  });

  it('should sync automatically and repeatedly', async () => {
    sync.updateState({ status: 'idle' } as any);

    await advanceTimeAndFlush(100);
    expect(mockSyncState).toHaveBeenCalledTimes(1);
    expect(sync.lastHeight).toBe(1);

    await advanceTimeAndFlush(1100);
    expect(mockSyncState).toHaveBeenCalledTimes(2);
    expect(sync.lastHeight).toBe(2);

    await advanceTimeAndFlush(1100);
    expect(mockSyncState).toHaveBeenCalledTimes(3);
    expect(sync.lastHeight).toBe(3);
  });

  it('should not start a new sync loop if state was already set', async () => {
    sync.updateState({ status: 'idle' } as any);

    await advanceTimeAndFlush(100);
    const callCountAfterFirstUpdate = mockSyncState.mock.calls.length;
    expect(callCountAfterFirstUpdate).toBe(1);

    sync.updateState({ status: 'ready' } as any);

    await advanceTimeAndFlush(1000);

    expect(mockSyncState.mock.calls.length).toBe(2);
  });

  it('should not sync when on generating-transaction page', async () => {
    jest.spyOn(sync, 'getCurrentUrl').mockReturnValue('http://localhost/generating-transaction');

    sync.updateState({ status: 'idle' } as any);

    // Give the async sync() a chance to run and check the URL
    await Promise.resolve();
    await Promise.resolve();

    expect(mockSyncState).not.toHaveBeenCalled();
    expect(sync.lastHeight).toBe(0);
  });
});
