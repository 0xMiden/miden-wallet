import { expose } from 'threads/worker';

import { ConsumeTransaction } from 'lib/miden/db/types';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

async function consumeNoteId(transaction: ConsumeTransaction): Promise<Uint8Array> {
  const midenClient = await MidenClientInterface.create();
  const result = await midenClient.consumeNoteId(transaction);
  return result.serialize();
}

export type ConsumeNoteIdWorker = typeof consumeNoteId;

expose(consumeNoteId);
