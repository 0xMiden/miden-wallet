import { spawn, Thread, Transfer, Worker } from 'threads';

import { SubmitTransaction } from 'workers/submitTransaction';

export const submitTransaction = async (
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
