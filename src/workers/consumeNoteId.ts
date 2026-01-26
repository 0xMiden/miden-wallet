import { Observable } from 'threads/observable';
import { expose } from 'threads/worker';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';

export type WorkerMessage = { type: 'connectivity_issue' } | { type: 'result'; payload: Uint8Array };

function consumeNoteId(
  transactionResultBytes: Uint8Array,
  network: MIDEN_NETWORK_NAME,
  delegateTransaction?: boolean
): Observable<WorkerMessage> {
  return new Observable(observer => {
    (async () => {
      try {
        await withWasmClientLock(async () => {
          const midenClient = await getMidenClient({
            network,
            onConnectivityIssue: () => {
              observer.next({ type: 'connectivity_issue' });
            }
          });

          await midenClient.submitTransaction(transactionResultBytes, delegateTransaction);
          observer.next({ type: 'result', payload: transactionResultBytes });
          observer.complete();
        });
      } catch (e) {
        console.error('[consumeNoteId Worker] Error:', e);
        observer.error(e);
      }
    })();
  });
}

export type ConsumeNoteIdWorker = typeof consumeNoteId;

expose(consumeNoteId);
