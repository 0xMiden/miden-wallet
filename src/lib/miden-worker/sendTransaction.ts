import { TransactionResult } from '@demox-labs/miden-sdk/dist/crates/miden_client_web';
import { spawn, Thread, Worker } from 'threads';

import { SendTransaction } from 'lib/miden/db/types';

export type SendTransactionWorker = (transaction: SendTransaction) => Promise<TransactionResult>;

export const sendTransaction = async (transaction: SendTransaction): Promise<TransactionResult> => {
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
