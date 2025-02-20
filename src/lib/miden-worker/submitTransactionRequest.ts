import { spawn, Thread, Transfer, Worker } from 'threads';

import { SubmitTransactionRequest } from 'workers/submitTransactionRequest';

export const submitTransactionRequest = async (address: string, transactionRequestBytes: Uint8Array): Promise<void> => {
  const worker = await spawn<SubmitTransactionRequest>(new Worker('./submitTransactionRequest.js'));

  try {
    await worker.transferTransactionRequest(Transfer(transactionRequestBytes.buffer));
    await worker.submitTransactionRequest(address);
    await Thread.terminate(worker);
  } catch (e) {
    await Thread.terminate(worker);
    throw e;
  }
};
