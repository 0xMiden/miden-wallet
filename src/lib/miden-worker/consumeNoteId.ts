import { TransactionResult } from '@demox-labs/miden-sdk/dist/crates/miden_client_web';
import { spawn, Thread, Worker } from 'threads';

import { ConsumeTransaction } from 'lib/miden/db/types';

export type ConsumeNoteIdWorker = (transaction: ConsumeTransaction) => Promise<TransactionResult>;

export const consumeNoteId = async (transaction: ConsumeTransaction): Promise<TransactionResult> => {
  const worker = await spawn<ConsumeNoteIdWorker>(new Worker('./consumeNoteId.js'));

  try {
    const result = await worker(transaction);
    console.log('consumeNoteId result', result);
    await Thread.terminate(worker);
    return result;
  } catch (e) {
    await Thread.terminate(worker);
    throw e;
  }
};
