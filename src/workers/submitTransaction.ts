import { expose } from 'threads/worker';

import { getMidenClient } from 'lib/miden/sdk/miden-client';

var transactionResultBytes: Uint8Array;

const SubmitTransaction = {
  transferTransactionResultBytes: (buffer: ArrayBuffer) => {
    transactionResultBytes = new Uint8Array(buffer);
  },
  submitTransaction: async (delegateTransaction?: boolean): Promise<Uint8Array> => {
    const midenClient = await getMidenClient();
    const result = await midenClient.submitTransaction(transactionResultBytes, delegateTransaction);
    const resultBytes = result.serialize();
    return resultBytes;
  }
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SubmitTransaction = typeof SubmitTransaction;

expose(SubmitTransaction);
