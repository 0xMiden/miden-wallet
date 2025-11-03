import { expose } from 'threads/worker';

import { getMidenClient } from 'lib/miden/sdk/miden-client';

var transactionRequest: Uint8Array;

const SubmitTransactionRequest = {
  transferTransactionRequest: (buffer: ArrayBuffer) => {
    transactionRequest = new Uint8Array(buffer);
  },
  submitTransactionRequest: async (address: string, delegateTransaction?: boolean): Promise<Uint8Array> => {
    const midenClientInterface = await getMidenClient();
    const result = await midenClientInterface.submitTransaction(address, transactionRequest, delegateTransaction);
    const resultBytes = result.serialize();
    return resultBytes;
  }
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SubmitTransactionRequest = typeof SubmitTransactionRequest;

expose(SubmitTransactionRequest);
