import { expose } from 'threads/worker';

import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';

var transactionResultBytes: Uint8Array;

const SubmitTransaction = {
  transferTransactionResultBytes: (buffer: ArrayBuffer) => {
    transactionResultBytes = new Uint8Array(buffer);
  },
  submitTransaction: async (delegateTransaction?: boolean): Promise<Uint8Array> => {
    return await withWasmClientLock(async () => {
      const midenClient = await getMidenClient();
      const result = await midenClient.submitTransaction(transactionResultBytes, delegateTransaction);
      return result.serialize();
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SubmitTransaction = typeof SubmitTransaction;

expose(SubmitTransaction);
