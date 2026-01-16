import { spawn, Thread, Worker } from 'threads';

import { addConnectivityIssue } from 'lib/miden/activity/connectivity-issues';
import { isMobile } from 'lib/platform';
import { ConsumeNoteIdWorker } from 'workers/consumeNoteId';

// Main thread implementation for mobile (avoids worker OOM issues)
// Reuses the singleton client to avoid spawning new SDK workers
const consumeNoteIdMainThread = async (
  transactionResultBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  console.log('[consumeNoteId] Running on main thread (mobile), reusing singleton client');
  const { getMidenClient, withWasmClientLock } = await import('lib/miden/sdk/miden-client');

  // Wrap in WASM lock to prevent concurrent access errors
  await withWasmClientLock(async () => {
    // Don't pass options - reuse the singleton client to avoid creating new workers
    const midenClient = await getMidenClient();

    console.log('[consumeNoteId] Submitting transaction...');
    await midenClient.submitTransaction(transactionResultBytes, delegateTransaction);
    console.log('[consumeNoteId] Transaction submitted successfully');
  });

  return transactionResultBytes;
};

// Worker implementation for desktop
const consumeNoteIdWorker = async (
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

export const consumeNoteId = async (
  transactionResultBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  if (isMobile()) {
    return consumeNoteIdMainThread(transactionResultBytes, delegateTransaction);
  }
  return consumeNoteIdWorker(transactionResultBytes, delegateTransaction);
};
