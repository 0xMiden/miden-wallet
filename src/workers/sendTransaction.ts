import { Observable } from 'threads/observable';
import { expose } from 'threads/worker';

import { SendTransaction } from 'lib/miden/db/types';
import { getMidenClient } from 'lib/miden/sdk/miden-client';

export type WorkerMessage = { type: 'connectivity_issue' } | { type: 'result'; payload: Uint8Array };

function sendTransaction(transaction: SendTransaction): Observable<WorkerMessage> {
  return new Observable(observer => {
    (async () => {
      try {
        const midenClient = await getMidenClient({
          onConnectivityIssue: () => {
            observer.next({ type: 'connectivity_issue' });
          }
        });
        const result = await midenClient.sendTransaction(transaction);
        observer.next({ type: 'result', payload: result.serialize() });
      } catch (err) {
        observer.error(err);
      }
    })();
  });
}

export type SendTransactionWorker = typeof sendTransaction;

expose(sendTransaction);
