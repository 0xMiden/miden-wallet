import { spawn, Thread, Worker } from 'threads';

import { addConnectivityIssue } from 'lib/miden/activity/connectivity-issues';
import { SendTransactionWorker } from 'workers/sendTransaction';

export const sendTransaction = async (
  transactionResultBytes: Uint8Array,
  delegateTransaction?: boolean
): Promise<Uint8Array> => {
  const worker = await spawn<SendTransactionWorker>(new Worker('./sendTransaction.js'));

  try {
    const observable = worker(transactionResultBytes, delegateTransaction);

    const resultPromise = new Promise<Uint8Array>((resolve, reject) => {
      observable.subscribe({
        next: message => {
          if (message.type === 'connectivity_issue') {
            addConnectivityIssue();
          } else if (message.type === 'result') {
            resolve(message.payload);
          }
        },
        error: err => {
          reject(err);
        }
      });
    });

    return await resultPromise;
  } finally {
    await Thread.terminate(worker);
  }
};
