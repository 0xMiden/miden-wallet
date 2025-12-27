import { WalletState } from 'lib/shared/types';

import { getMidenClient, withWasmClientLock } from '../sdk/miden-client';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

class Sync {
  lastHeight: number = 0;
  lastRecordId: number = 0;
  getHeightFetchTimestamp: number = 0;
  state?: WalletState;
  ampCycles: number = 0;

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
    const isGeneratingUrl = window.location.href.search('generating-transaction') > -1;
    if (isGeneratingUrl) {
      return;
    }
    const client = await getMidenClient();
    if (!client) {
      return;
    }
    const syncSummary = await client.syncState();
    this.lastHeight = syncSummary.blockNum();
    await sleep(3000);
    await this.sync();
  }
}

export const AutoSync = new Sync();

export interface Keys {
  privateKey: string;
  viewKey: string;
}
