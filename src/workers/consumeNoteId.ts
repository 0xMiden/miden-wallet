import { Observable } from 'threads/observable';
import { expose } from 'threads/worker';

import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

export type WorkerMessage = { type: 'connectivity_issue' } | { type: 'result'; payload: Uint8Array };

function consumeNoteId(transactionResultBytes: Uint8Array, delegateTransaction?: boolean): Observable<WorkerMessage> {
  return new Observable(observer => {
    (async () => {
      try {
        const handleConnectivityIssue = () => {
          console.log('Worker: Detected connectivity issue. Emitting event.');
          observer.next({ type: 'connectivity_issue' });
        };

        const midenClient = await MidenClientInterface.create({
          onConnectivityIssue: handleConnectivityIssue
        });

        await midenClient.submitTransaction(transactionResultBytes, delegateTransaction);

        observer.next({ type: 'result', payload: transactionResultBytes });

        observer.complete();
      } catch (e) {
        observer.error(e);
      }
    })();
  });
}

export type ConsumeNoteIdWorker = typeof consumeNoteId;

expose(consumeNoteId);
