import { MessageHttpOutput } from '@demox-labs/amp-core/script/http-types';

import { ampApi } from 'lib/amp/amp-interface';
import { WalletState } from 'lib/shared/types';

import { MidenClientInterface } from '../sdk/miden-client-interface';

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
    await this.syncAmp();
    await sleep(3000);
    await this.sync();
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
