import { WalletState } from 'lib/shared/types';
import { useWalletStore } from 'lib/store';

import { getMidenClient, withWasmClientLock } from '../sdk/miden-client';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

    // Set syncing status to true before sync
    useWalletStore.getState().setSyncStatus(true);

    try {
      // Wrap WASM client operations in a lock to prevent concurrent access
      const blockNum = await withWasmClientLock(async () => {
        const client = await getMidenClient();
        if (!client) {
          return null;
        }
        const syncSummary = await client.syncState();
        return syncSummary.blockNum();
      });

      if (blockNum !== null) {
        this.lastHeight = blockNum;
      }
    } finally {
      // Set syncing status to false after sync completes
      useWalletStore.getState().setSyncStatus(false);
    }

    await sleep(1000);
    await this.sync();
  }
}

export const AutoSync = new Sync();

export interface Keys {
  privateKey: string;
  viewKey: string;
}
