import { Observable } from 'threads/observable';
import { expose } from 'threads/worker';

import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';

export type WorkerMessage = { type: 'connectivity_issue' } | { type: 'result'; payload: Uint8Array };

function consumeNoteId(transactionResultBytes: Uint8Array, delegateTransaction?: boolean): Observable<WorkerMessage> {
  return new Observable(observer => {
    (async () => {
      try {
        await withWasmClientLock(async () => {
          const handleConnectivityIssue = () => {
            console.log('Worker: Detected connectivity issue. Emitting event.');
            observer.next({ type: 'connectivity_issue' });
          };

          const midenClient = await getMidenClient({
            onConnectivityIssue: handleConnectivityIssue
          });

          await midenClient.submitTransaction(transactionResultBytes, delegateTransaction);

          observer.next({ type: 'result', payload: transactionResultBytes });

          observer.complete();
        });
      } catch (e) {
        observer.error(e);
      }
    })();
  });
}

export type ConsumeNoteIdWorker = typeof consumeNoteId;

expose(consumeNoteId);
