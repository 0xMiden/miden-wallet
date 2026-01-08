import { getMidenClient } from '../sdk/miden-client';
import { AutoSync, AMP_SYNC_STORAGE_KEY, isAmpSyncEnabled } from './autoSync';

jest.mock('lib/amp/amp-interface', () => ({
  ampApi: {
    getMessagesForRecipient: jest.fn()
  }
}));

jest.mock('../sdk/miden-client', () => ({
  getMidenClient: jest.fn(),
  withWasmClientLock: async <T>(operation: () => Promise<T>): Promise<T> => operation()
}));

describe('AutoSync', () => {
  let sync = AutoSync;
  let midenClient: any;
  beforeEach(async () => {
    jest.resetModules();
    process.env.MIDEN_USE_MOCK_CLIENT = 'true';
    localStorage.clear();
    jest.clearAllMocks();
    midenClient = await getMidenClient();
    console.log('Miden client obtained in test setup', midenClient);
  });

  it('should start syncing when state is updated from undefined', async () => {
    const syncStateSpy = jest.spyOn(midenClient, 'syncState').mockResolvedValue({
      blockNum: () => 42
    });
    expect(sync.lastHeight).toBe(0);
    await new Promise(resolve => setTimeout(resolve, 3500));
    expect(syncStateSpy).toHaveBeenCalled();
    expect(sync.lastHeight).toBe(42);
  });
});
