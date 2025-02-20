import { expose } from 'threads/worker';

import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

var transactionRequest: Uint8Array;

const SubmitTransactionRequest = {
  transferTransactionRequest: (buffer: ArrayBuffer) => {
    transactionRequest = new Uint8Array(buffer);
  },
  submitTransactionRequest: async (address: string) => {
    const midenClientInterface = await MidenClientInterface.create();
    await midenClientInterface.submitTransaction(address, transactionRequest);
  }
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SubmitTransactionRequest = typeof SubmitTransactionRequest;

expose(SubmitTransactionRequest);
