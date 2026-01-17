import { isMobile } from 'lib/platform';
import { WalletState } from 'lib/shared/types';
import { useWalletStore } from 'lib/store';

import { getMidenClient, withWasmClientLock } from '../sdk/miden-client';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Debug info for iOS troubleshooting - exposed globally so UI can read it
export type SyncDebugInfo = {
  syncCount: number;
  lastSyncTime: string;
  lastBlockNum: number | null;
  lastError?: string;
};

// Global debug info that can be read by UI components
export const syncDebugInfo: SyncDebugInfo = {
  syncCount: 0,
  lastSyncTime: 'never',
  lastBlockNum: null,
  lastError: undefined
};

export class Sync {
  lastHeight: number = 0;
  lastRecordId: number = 0;
  getHeightFetchTimestamp: number = 0;
  state?: WalletState;
  ampCycles: number = 0;

  // Exposed for testing
  getCurrentUrl(): string {
    return window.location.href;
  }

  public updateState(state: WalletState) {
    const previousState = this.state;
    this.state = state;

    if (!previousState) {
      // Start repeatedly syncing
      this.sync();
    }
  }

  async sync() {
    // Don't sync on the generating transaction page
    const isGeneratingUrl = this.getCurrentUrl().search('generating-transaction') > -1;
    if (isGeneratingUrl) {
      return;
    }

    const storeState = useWalletStore.getState();

    // On mobile, don't sync while transaction modal is open to avoid lock contention
    if (isMobile() && storeState.isTransactionModalOpen) {
      console.log('[AutoSync] Skipping sync while transaction modal is open');
      await sleep(3000);
      await this.sync();
      return;
    }

    // On mobile, don't sync while dApp browser is open to avoid lock contention
    if (isMobile() && storeState.isDappBrowserOpen) {
      console.log('[AutoSync] Skipping sync while dApp browser is open');
      await sleep(3000);
      await this.sync();
      return;
    }

    // Set syncing status to true before sync
    useWalletStore.getState().setSyncStatus(true);

    try {
      // Wrap WASM client operations in a lock to prevent concurrent access
      const blockNum = await withWasmClientLock(async () => {
        const client = await getMidenClient();
        if (!client) {
          syncDebugInfo.lastError = 'getMidenClient returned null';
          return null;
        }
        const syncSummary = await client.syncState();
        return syncSummary.blockNum();
      });

      if (blockNum !== null) {
        this.lastHeight = blockNum;
        syncDebugInfo.lastBlockNum = blockNum;
        syncDebugInfo.lastError = undefined;
      }
      syncDebugInfo.syncCount++;
      syncDebugInfo.lastSyncTime = new Date().toLocaleTimeString();
    } catch (error) {
      // Log error but continue the sync loop - don't let errors stop syncing
      console.error('[AutoSync] Error during sync:', error);
      syncDebugInfo.lastError = String(error);
      syncDebugInfo.lastSyncTime = new Date().toLocaleTimeString();
    } finally {
      // Set syncing status to false after sync completes
      useWalletStore.getState().setSyncStatus(false);
    }

    await sleep(3000);
    await this.sync();
  }
}

export const AutoSync = new Sync();

export interface Keys {
  privateKey: string;
  viewKey: string;
}
