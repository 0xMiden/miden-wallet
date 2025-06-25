import { spawn, Thread, Worker } from 'threads';

import { addConnectivityIssue } from 'lib/miden/activity/connectivity-issues';
import { ConsumeTransaction } from 'lib/miden/db/types';
import { ConsumeNoteIdWorker } from 'workers/consumeNoteId';
// Import the function that can actually modify the frontend state

export const consumeNoteId = async (transaction: ConsumeTransaction): Promise<Uint8Array> => {
  const worker = await spawn<ConsumeNoteIdWorker>(new Worker('./consumeNoteId.js'));

  try {
    const observable = worker(transaction);

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
