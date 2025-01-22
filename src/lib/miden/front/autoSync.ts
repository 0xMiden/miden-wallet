import { getHeight, getLastRecordId } from 'lib/miden-chain';
import { isGPUAccelerationEnabled } from 'lib/gpu/gpu-settings';
import { logger } from 'shared/logger';

import { syncOwnedRecords, completeOwnedRecords } from '../activity/sync';

import { SyncOptions } from '../activity/sync/sync-options';
import { tagOwnedRecords } from '../activity/tagging/tag';
import { WalletState } from 'lib/shared/types';
import { MidenClientInterface } from '../sdk/miden-client-interface';
import { ampApi } from 'lib/amp/amp-interface';
import { MessageHttpOutput } from '@demox-labs/amp-core/script/http-types';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const midenClient = await MidenClientInterface.create();

export const AMP_SYNC_STORAGE_KEY = 'amp-sync-storage-key';
export const DEFAULT_ENABLE_AMP = false;
export const AMP_CYCLE_WAIT = 5;

export function isAmpSyncEnabled() {
  const stored = localStorage.getItem(AMP_SYNC_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as boolean) : DEFAULT_ENABLE_AMP;
}

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

    await this.syncChain();
    await this.syncAmp();
    await sleep(3000);
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

  async syncAmp() {
    const publicKey = this.state?.currentAccount?.publicKey;
    const ampSyncEnabled = isAmpSyncEnabled();
    const isAmpCycle = this.ampCycles % AMP_CYCLE_WAIT === 0;

    if (publicKey && ampSyncEnabled && isAmpCycle) {
      const response = await ampApi.getMessagesForRecipient(publicKey);
      const messages: MessageHttpOutput[] = await response.json();
      if (messages.length > 0) {
        console.log('Syncing amp...');

        // TOOD: Need a way to clear the messages once they're recieved
        for (let message of messages) {
          // TODO: Potentially tweak upstream to make this cleaner
          const noteBytes = new Uint8Array(message.body.split(',').map(Number));

          await midenClient.importNoteBytes(noteBytes);
        }
      }
    }

    this.ampCycles++;
  }
}

export const AutoSync = new Sync();

export interface Keys {
  privateKey: string;
  viewKey: string;
}
