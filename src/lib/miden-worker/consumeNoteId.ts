import { spawn, Thread, Worker } from 'threads';

import { addConnectivityIssue } from 'lib/miden/activity/connectivity-issues';
import { ConsumeNoteIdWorker } from 'workers/consumeNoteId';

export const consumeNoteId = async (
  transactionResultBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  console.log('[consumeNoteId] Starting worker spawn...');

  let worker;
  try {
    console.log('[consumeNoteId] Creating Worker instance...');
    const workerInstance = new Worker('./consumeNoteId.js');
    console.log('[consumeNoteId] Worker instance created, spawning...');
    worker = await spawn<ConsumeNoteIdWorker>(workerInstance);
    console.log('[consumeNoteId] Worker spawned successfully');
  } catch (err) {
    console.error('[consumeNoteId] Worker spawn failed:', err);
    throw err;
  }

  try {
    const observable = worker(transactionResultBytes, delegateTransaction);

    const resultPromise = new Promise<Uint8Array>((resolve, reject) => {
      observable.subscribe({
        next: message => {
          if (message.type === 'connectivity_issue') {
            console.log('[consumeNoteId] Received connectivity issue from worker');
            addConnectivityIssue();
          } else if (message.type === 'result') {
            resolve(message.payload);
          }
        },
        error: err => {
          console.error('[consumeNoteId] Worker error:', err);
          reject(err);
        },
        complete: () => {
          console.log('[consumeNoteId] Worker stream completed');
        }
      });
    });

    return await resultPromise;
  } finally {
    await Thread.terminate(worker);
  }
};
