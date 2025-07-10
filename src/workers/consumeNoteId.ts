import { Observable } from 'threads/observable';
import { expose } from 'threads/worker';

import { ConsumeTransaction } from 'lib/miden/db/types';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

export type WorkerMessage = { type: 'connectivity_issue' } | { type: 'result'; payload: Uint8Array };

function consumeNoteId(transaction: ConsumeTransaction): Observable<WorkerMessage> {
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

        const result = await midenClient.consumeNoteId(transaction);

        observer.next({ type: 'result', payload: result.serialize() });

        observer.complete();
      } catch (e) {
        observer.error(e);
      }
    })();
  });
}

export type ConsumeNoteIdWorker = typeof consumeNoteId;

expose(consumeNoteId);
