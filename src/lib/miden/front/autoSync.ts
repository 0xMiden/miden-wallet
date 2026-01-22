import { isDesktop, isMobile } from 'lib/platform';
import { WalletState, WalletStatus } from 'lib/shared/types';
import { useWalletStore } from 'lib/store';

import { getMidenClient, withWasmClientLock } from '../sdk/miden-client';

// Debug logging for desktop
async function syncLog(message: string): Promise<void> {
  console.log(message);
  if (isDesktop()) {
    try {
      const { tauriLog } = await import('lib/desktop/secure-storage');
      await tauriLog(message);
    } catch {}
  }
}

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

    // When wallet becomes Ready, start the sync loop
    // (balance fetch is handled by syncFromBackend in Zustand store)
    const justBecameReady =
      state.status === WalletStatus.Ready && (!previousState || previousState.status !== WalletStatus.Ready);

    if (justBecameReady) {
      this.initializeAndSync();
    } else if (!previousState) {
      // First state update but not Ready yet - start sync loop (will wait until Ready)
      this.sync();
    }
  }

  /**
   * Start the sync loop when wallet becomes Ready.
   * Balance fetch is handled by syncFromBackend in the Zustand store (earliest possible point).
   */
  private initializeAndSync() {
    this.sync();
  }

  async sync() {
    const storeState = useWalletStore.getState();

    // Don't sync when wallet isn't ready (locked/idle) - no account to sync
    if (storeState.status !== WalletStatus.Ready) {
      await sleep(3000);
      await this.sync();
      return;
    }

    // Don't sync on the generating transaction page
    const isGeneratingUrl = this.getCurrentUrl().search('generating-transaction') > -1;
    if (isGeneratingUrl) {
      return;
    }

    // On mobile, don't sync while transaction modal is open to avoid lock contention
    if (isMobile() && storeState.isTransactionModalOpen) {
      console.log('[AutoSync] Skipping sync while transaction modal is open');
      await sleep(3000);
      await this.sync();
      return;
    }

    // Set syncing status to true before sync
    useWalletStore.getState().setSyncStatus(true);
    await syncLog(`[AutoSync] Starting sync #${syncDebugInfo.syncCount + 1}...`);

    try {
      // Wrap WASM client operations in a lock to prevent concurrent access
      await syncLog('[AutoSync] Acquiring WASM lock...');
      const blockNum = await withWasmClientLock(async () => {
        await syncLog('[AutoSync] Got lock, getting client...');
        const client = await getMidenClient();
        if (!client) {
          syncDebugInfo.lastError = 'getMidenClient returned null';
          await syncLog('[AutoSync] ERROR: getMidenClient returned null');
          return null;
        }
        await syncLog('[AutoSync] Got client, calling syncState()...');
        const syncSummary = await client.syncState();
        const bn = syncSummary.blockNum();
        await syncLog(`[AutoSync] syncState() completed, blockNum=${bn}`);
        return bn;
      });

      if (blockNum !== null) {
        this.lastHeight = blockNum;
        syncDebugInfo.lastBlockNum = blockNum;
        syncDebugInfo.lastError = undefined;
      }
      syncDebugInfo.syncCount++;
      syncDebugInfo.lastSyncTime = new Date().toLocaleTimeString();
      await syncLog(`[AutoSync] Sync complete, count=${syncDebugInfo.syncCount}, blockNum=${blockNum}`);
    } catch (error) {
      // Log error but continue the sync loop - don't let errors stop syncing
      console.error('[AutoSync] Error during sync:', error);
      await syncLog(`[AutoSync] ERROR: ${error instanceof Error ? error.message : String(error)}`);
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
