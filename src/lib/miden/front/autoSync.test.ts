import '../../../../test/jest-mocks';

import { AutoSync, AMP_SYNC_STORAGE_KEY, isAmpSyncEnabled } from './autoSync';
import { ampApi } from 'lib/amp/amp-interface';
import { getMidenClient } from '../sdk/miden-client';

jest.mock('lib/amp/amp-interface', () => ({
  ampApi: {
    getMessagesForRecipient: jest.fn()
  }
}));

jest.mock('../sdk/miden-client', () => ({
  getMidenClient: jest.fn()
}));

describe('AutoSync', () => {
  let sync: any;

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    const SyncCtor = (AutoSync as any).constructor;
    sync = new SyncCtor();
    sync.state = { currentAccount: { publicKey: 'pk' } };
    sync.ampCycles = 0;
  });

  it('respects localStorage flag when checking amp sync enabled', () => {
    expect(isAmpSyncEnabled()).toBe(false);
    localStorage.setItem(AMP_SYNC_STORAGE_KEY, 'true');
    expect(isAmpSyncEnabled()).toBe(true);
  });

  it('imports amp messages when enabled and on cycle', async () => {
    localStorage.setItem(AMP_SYNC_STORAGE_KEY, 'true');
    (ampApi.getMessagesForRecipient as jest.Mock).mockResolvedValue({
      json: async () => [{ body: '1,2,3' }]
    });

    const importNoteBytes = jest.fn();
    (getMidenClient as jest.Mock).mockResolvedValue({ importNoteBytes });

    await sync.syncAmp();

    expect(ampApi.getMessagesForRecipient).toHaveBeenCalledWith('pk');
    expect(importNoteBytes).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
    expect(sync.ampCycles).toBe(1);
  });

  it('skips amp sync when disabled', async () => {
    localStorage.setItem(AMP_SYNC_STORAGE_KEY, 'false');
    (ampApi.getMessagesForRecipient as jest.Mock).mockResolvedValue({
      json: async () => [{ body: '1,2,3' }]
    });

    await sync.syncAmp();

    expect(ampApi.getMessagesForRecipient).not.toHaveBeenCalled();
  });
});
