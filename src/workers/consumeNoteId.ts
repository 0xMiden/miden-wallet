import { TransactionResult } from '@demox-labs/miden-sdk/dist/crates/miden_client_web';
import { expose } from 'threads/worker';

import { ConsumeTransaction } from 'lib/miden/db/types';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

async function consumeNoteId(transaction: ConsumeTransaction): Promise<TransactionResult> {
  const midenClient = await MidenClientInterface.create();
  return await midenClient.consumeNoteId(transaction);
}

expose(consumeNoteId);
