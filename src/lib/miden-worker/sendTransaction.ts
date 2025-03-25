import { TransactionResult } from '@demox-labs/miden-sdk';
import { spawn, Thread, Worker } from 'threads';

import { SendTransaction } from 'lib/miden/db/types';
import { SendTransactionWorker } from 'workers/sendTransaction';

export const sendTransaction = async (transaction: SendTransaction): Promise<Uint8Array> => {
  const worker = await spawn<SendTransactionWorker>(new Worker('./sendTransaction.js'));

  try {
    const result = await worker(transaction);
    await Thread.terminate(worker);
    return result;
  } catch (e) {
    await Thread.terminate(worker);
    throw e;
  }
};
