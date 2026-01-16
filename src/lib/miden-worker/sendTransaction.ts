import { spawn, Thread, Worker } from 'threads';

import { addConnectivityIssue } from 'lib/miden/activity/connectivity-issues';
import { isMobile } from 'lib/platform';
import { SendTransactionWorker } from 'workers/sendTransaction';

// Main thread implementation for mobile (avoids worker OOM issues)
// Reuses the singleton client to avoid spawning new SDK workers
const sendTransactionMainThread = async (
  transactionResultBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  console.log('[sendTransaction] Running on main thread (mobile), reusing singleton client');
  const { getMidenClient, withWasmClientLock } = await import('lib/miden/sdk/miden-client');

  // Wrap in WASM lock to prevent concurrent access errors
  await withWasmClientLock(async () => {
    // Don't pass options - reuse the singleton client to avoid creating new workers
    const midenClient = await getMidenClient();

    console.log('[sendTransaction] Submitting transaction (skipSync=true for mobile)...');
    // Skip syncState on mobile to reduce memory pressure - AutoSync handles this
    await midenClient.submitTransaction(transactionResultBytes, delegateTransaction, true);
    console.log('[sendTransaction] Transaction submitted successfully');
  });

  return transactionResultBytes;
};

// Worker implementation for desktop
const sendTransactionWorker = async (
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

export const sendTransaction = async (
  transactionResultBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  if (isMobile()) {
    return sendTransactionMainThread(transactionResultBytes, delegateTransaction);
  }
  return sendTransactionWorker(transactionResultBytes, delegateTransaction);
};
