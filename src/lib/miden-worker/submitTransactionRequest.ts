import { spawn, Thread, Transfer, Worker } from 'threads';

import { SubmitTransactionRequest } from 'workers/submitTransactionRequest';

export const submitTransactionRequest = async (
  address: string,
  transactionRequestBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  const worker = await spawn<SubmitTransactionRequest>(new Worker('./submitTransactionRequest.js'));

  try {
    await worker.transferTransactionRequest(Transfer(transactionRequestBytes.buffer));
    const result = await worker.submitTransactionRequest(address, delegateTransaction);
    await Thread.terminate(worker);
    return result;
  } catch (e) {
    await Thread.terminate(worker);
    throw e;
  }
};
