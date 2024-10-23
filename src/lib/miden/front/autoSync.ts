import { getHeight, getLastRecordId } from 'lib/miden-chain';
import { isGPUAccelerationEnabled } from 'lib/gpu/gpu-settings';
import { logger } from 'shared/logger';

import { syncOwnedRecords, completeOwnedRecords } from '../activity/sync';

import { setAccountCreationMetadata } from '../activity/sync/account-creation';
import { SyncOptions } from '../activity/sync/sync-options';
import { tagOwnedRecords } from '../activity/tagging/tag';
import { WalletState } from 'lib/shared/types';
import { MidenClientInterface } from '../sdk/miden-client-interface';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const midenClient = await MidenClientInterface.create();
class Sync {
  lastHeight: number = 0;
  lastRecordId: number = 0;
  getHeightFetchTimestamp: number = 0;
  state?: WalletState;

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

    await this.syncChain();
    await sleep(5000);
    await this.sync();
  }

  private async syncRecords(keys: Keys[], gpuEnabled: boolean) {
    const adapter = navigator.gpu ? await navigator.gpu.requestAdapter() : null;
    const hasGpu = !!adapter && gpuEnabled;
    const syncOptions: SyncOptions = { includeTaggedRecords: true, useGPU: hasGpu };
    const syncBatch = hasGpu ? 1 : 2;
    const batchSize = hasGpu ? 200_000 : 5_000; // number of blocks to iterate through each batch
    await navigator.locks
      .request(`records`, { ifAvailable: true }, async lock => {
        if (!lock) return;

        await syncOwnedRecords(syncOptions, keys, this.lastRecordId, syncBatch, batchSize);
        await completeOwnedRecords(keys);
        await tagOwnedRecords(keys);
      })
      .catch(e => {
        logger.error(`Failed to sync records `, e);
      });
  }

  private async syncTransactions(chainId: string, accounts: string[], currentBlock: number) {}

  private async cancelFailedTransactions(chainId: string) {}

  private async syncAccountCreationBlockHeights(ownMnemonic: boolean, blockHeight: number) {
    const lockKey = `account-creation-block-heights`;
    await navigator.locks
      .request(lockKey, { ifAvailable: true }, async lock => {
        if (!lock) return;
        let accountCreationBlockHeightTasks: Promise<any>[] = [];

        await Promise.all(accountCreationBlockHeightTasks);
      })
      .catch(e => {
        logger.error(`Failed to sync account creation block heights`, e);
      });
  }

  async syncChain() {
    try {
      await midenClient.syncState();
    } catch (e) {
      logger.error(`Failed to sync chain: ${e}`);
    }
  }
}

export const AutoSync = new Sync();

export interface Keys {
  privateKey: string;
  viewKey: string;
}
