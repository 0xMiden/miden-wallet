import { spawn, Thread, Transfer, Worker } from 'threads';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { SubmitTransaction } from 'workers/submitTransaction';

export const submitTransaction = async (
  transactionResultBytes: Uint8Array,
  networkId: MIDEN_NETWORK_NAME,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  const workerInstance = new Worker('./submitTransaction.js');
  const worker = await spawn<SubmitTransaction>(workerInstance);

  try {
    await worker.transferTransactionResultBytes(Transfer(transactionResultBytes.buffer));
    const result = await worker.submitTransaction(networkId, delegateTransaction);
    await Thread.terminate(worker);
    return result;
  } catch (e) {
    console.error('[submitTransaction] Worker error:', e);
    await Thread.terminate(worker);
    throw e;
  }
};
