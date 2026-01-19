import { expose } from 'threads/worker';

import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';

var transactionResultBytes: Uint8Array;

const SubmitTransaction = {
  transferTransactionResultBytes: (buffer: ArrayBuffer) => {
    console.log('[submitTransaction Worker] Received bytes, length:', buffer.byteLength);
    transactionResultBytes = new Uint8Array(buffer);
  },
  submitTransaction: async (delegateTransaction?: boolean): Promise<Uint8Array> => {
    console.log('[submitTransaction Worker] Starting submission, delegateTransaction:', delegateTransaction);
    console.log('[submitTransaction Worker] Acquiring WASM lock...');
    return await withWasmClientLock(async () => {
      console.log('[submitTransaction Worker] Lock acquired, getting client...');
      const midenClient = await getMidenClient();
      console.log('[submitTransaction Worker] Client obtained, submitting transaction...');
      const result = await midenClient.submitTransaction(transactionResultBytes, delegateTransaction);
      console.log('[submitTransaction Worker] Transaction submitted successfully');
      return result.serialize();
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SubmitTransaction = typeof SubmitTransaction;

expose(SubmitTransaction);
