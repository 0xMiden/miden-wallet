import { TransactionResult } from '@demox-labs/miden-sdk';
import { spawn, Thread, Worker } from 'threads';

import { ConsumeTransaction } from 'lib/miden/db/types';

import { ConsumeNoteIdWorker } from 'workers/consumeNoteId';

export const consumeNoteId = async (transaction: ConsumeTransaction): Promise<Uint8Array> => {
  const worker = await spawn<ConsumeNoteIdWorker>(new Worker('./consumeNoteId.js'));

  try {
    const result = await worker(transaction);
    await Thread.terminate(worker);
    return result;
  } catch (e) {
    await Thread.terminate(worker);
    throw e;
  }
};
