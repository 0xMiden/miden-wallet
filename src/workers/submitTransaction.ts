import { expose } from 'threads/worker';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';

var transactionResultBytes: Uint8Array;

const SubmitTransaction = {
  transferTransactionResultBytes: (buffer: ArrayBuffer) => {
    transactionResultBytes = new Uint8Array(buffer);
  },
  submitTransaction: async (network: MIDEN_NETWORK_NAME, delegateTransaction?: boolean): Promise<Uint8Array> => {
    return await withWasmClientLock(async () => {
      const midenClient = await getMidenClient({ network });
      const result = await midenClient.submitTransaction(transactionResultBytes, delegateTransaction);
      return result.serialize();
    });
  }
};

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type SubmitTransaction = typeof SubmitTransaction;

expose(SubmitTransaction);
