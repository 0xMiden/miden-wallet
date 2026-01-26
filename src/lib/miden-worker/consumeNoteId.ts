import { spawn, Thread, Worker } from 'threads';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { addConnectivityIssue } from 'lib/miden/activity/connectivity-issues';
import { ConsumeNoteIdWorker } from 'workers/consumeNoteId';

export const consumeNoteId = async (
  transactionResultBytes: Uint8Array,
  networkId: MIDEN_NETWORK_NAME,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  console.log('Starting consumeNoteId worker for network:', networkId);
  const workerInstance = new Worker('./consumeNoteId.js');
  const worker = await spawn<ConsumeNoteIdWorker>(workerInstance);

  try {
    const observable = worker(transactionResultBytes, networkId, delegateTransaction);

    const resultPromise = new Promise<Uint8Array>((resolve, reject) => {
      observable.subscribe({
        next: message => {
          if (message.type === 'connectivity_issue') {
            addConnectivityIssue();
          } else if (message.type === 'result') {
            resolve(message.payload);
          }
        },
        error: err => {
          console.error('[consumeNoteId] Worker error:', err);
          reject(err);
        }
      });
    });

    return await resultPromise;
  } finally {
    await Thread.terminate(worker);
  }
};
