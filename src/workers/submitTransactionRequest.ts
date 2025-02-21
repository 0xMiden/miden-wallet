import { TransactionResult } from '@demox-labs/miden-sdk/dist/crates/miden_client_web';
import { expose } from 'threads/worker';

import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

var transactionRequest: Uint8Array;

const SubmitTransactionRequest = {
  transferTransactionRequest: (buffer: ArrayBuffer) => {
    transactionRequest = new Uint8Array(buffer);
  },
  submitTransactionRequest: async (address: string): Promise<TransactionResult> => {
    const midenClientInterface = await MidenClientInterface.create();
    const result = await midenClientInterface.submitTransaction(address, transactionRequest);
    return result;
  }
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SubmitTransactionRequest = typeof SubmitTransactionRequest;

expose(SubmitTransactionRequest);
