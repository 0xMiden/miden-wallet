import { spawn, Thread, Worker } from 'threads';

import { addConnectivityIssue } from 'lib/miden/activity/connectivity-issues';
import { ConsumeNoteIdWorker } from 'workers/consumeNoteId';
// Import the function that can actually modify the frontend state

export const consumeNoteId = async (
  transactionResultBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  console.log('[consumeNoteId] Starting worker spawn...');
  console.log('[consumeNoteId] Worker URL: ./consumeNoteId.js');
  console.log('[consumeNoteId] Current location:', window.location.href);

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
          // Here we handle the different message types
          if (message.type === 'connectivity_issue') {
            console.log('Caller: Received connectivity issue from worker.');
            // This code runs in the main context, so this call is safe!
            addConnectivityIssue();
          } else if (message.type === 'result') {
            // Resolve the promise with the final payload
            resolve(message.payload);
          }
        },
        error: err => {
          // Reject the promise if the worker throws an error
          reject(err);
        },
        // The `complete` handler isn't strictly necessary if `resolve` is always called,
        // but it's good practice.
        complete: () => {
          console.log('Worker stream completed.');
        }
      });
    });

    // Await the promise that wraps the subscription
    return await resultPromise;
  } finally {
    // Ensure the worker is terminated in all cases
    await Thread.terminate(worker);
  }
};
