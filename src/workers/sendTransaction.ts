import { TransactionResult } from '@demox-labs/miden-sdk/dist/crates/miden_client_web';
import { expose } from 'threads/worker';

import { SendTransaction } from 'lib/miden/db/types';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

async function sendTransaction(transaction: SendTransaction): Promise<TransactionResult> {
  const midenClient = await MidenClientInterface.create();
  return await midenClient.sendTransaction(transaction);
}

expose(sendTransaction);
