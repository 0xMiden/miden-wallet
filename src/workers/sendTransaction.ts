import { TransactionResult } from '@demox-labs/miden-sdk';
import { expose } from 'threads/worker';

import { SendTransaction } from 'lib/miden/db/types';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

async function sendTransaction(transaction: SendTransaction): Promise<Uint8Array> {
  const midenClient = await MidenClientInterface.create();
  const result = await midenClient.sendTransaction(transaction);
  return result.serialize();
}

export type SendTransactionWorker = typeof sendTransaction;

expose(sendTransaction);
