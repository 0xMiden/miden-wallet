import { spawn, Thread, Worker } from 'threads';

import { addConnectivityIssue } from 'lib/miden/activity/connectivity-issues';
import { SendTransactionWorker } from 'workers/sendTransaction';

export const sendTransaction = async (
  transactionResultBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  console.log('[sendTransaction] Starting worker spawn...');

  let worker;
  try {
    console.log('[sendTransaction] Creating Worker instance...');
    const workerInstance = new Worker('./sendTransaction.js');
    console.log('[sendTransaction] Worker instance created, spawning...');
    worker = await spawn<SendTransactionWorker>(workerInstance);
    console.log('[sendTransaction] Worker spawned successfully');
  } catch (err) {
    console.error('[sendTransaction] Worker spawn failed:', err);
    throw err;
  }

  try {
    const observable = worker(transactionResultBytes, delegateTransaction);

    const resultPromise = new Promise<Uint8Array>((resolve, reject) => {
      observable.subscribe({
        next: message => {
          if (message.type === 'connectivity_issue') {
            console.log('[sendTransaction] Received connectivity issue from worker');
            addConnectivityIssue();
          } else if (message.type === 'result') {
            console.log('[sendTransaction] Received result from worker');
            resolve(message.payload);
          }
        },
        error: err => {
          console.error('[sendTransaction] Worker error:', err);
          reject(err);
        },
        complete: () => {
          console.log('[sendTransaction] Worker stream completed');
        }
      });
    });

    return await resultPromise;
  } finally {
    await Thread.terminate(worker);
  }
};
