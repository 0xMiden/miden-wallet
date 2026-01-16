import { spawn, Thread, Transfer, Worker } from 'threads';

import { isMobile } from 'lib/platform';
import { SubmitTransaction } from 'workers/submitTransaction';

// Main thread implementation for mobile (avoids worker OOM issues)
const submitTransactionMainThread = async (
  transactionResultBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  console.log('[submitTransaction] Running on main thread (mobile)');
  const { getMidenClient, withWasmClientLock } = await import('lib/miden/sdk/miden-client');

  // Wrap in WASM lock to prevent concurrent access errors
  await withWasmClientLock(async () => {
    const midenClient = await getMidenClient();

    console.log('[submitTransaction] Submitting transaction (skipSync=true for mobile)...');
    // Skip syncState on mobile to reduce memory pressure - AutoSync handles this
    await midenClient.submitTransaction(transactionResultBytes, delegateTransaction, true);
    console.log('[submitTransaction] Transaction submitted successfully');
  });

  return transactionResultBytes;
};

// Worker implementation for desktop
const submitTransactionWorker = async (
  transactionResultBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  console.log('[submitTransaction] Starting worker spawn...');

  let worker;
  try {
    console.log('[submitTransaction] Creating Worker instance...');
    const workerInstance = new Worker('./submitTransaction.js');
    console.log('[submitTransaction] Worker instance created, spawning...');
    worker = await spawn<SubmitTransaction>(workerInstance);
    console.log('[submitTransaction] Worker spawned successfully');
  } catch (err) {
    console.error('[submitTransaction] Worker spawn failed:', err);
    throw err;
  }

  try {
    console.log('[submitTransaction] Transferring transaction result bytes...');
    await worker.transferTransactionResultBytes(Transfer(transactionResultBytes.buffer));
    console.log('[submitTransaction] Calling submitTransaction...');
    const result = await worker.submitTransaction(delegateTransaction);
    console.log('[submitTransaction] Transaction submitted successfully');
    await Thread.terminate(worker);
    return result;
  } catch (e) {
    console.error('[submitTransaction] Worker error:', e);
    await Thread.terminate(worker);
    throw e;
  }
};

export const submitTransaction = async (
  transactionResultBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  if (isMobile()) {
    return submitTransactionMainThread(transactionResultBytes, delegateTransaction);
  }
  return submitTransactionWorker(transactionResultBytes, delegateTransaction);
};
