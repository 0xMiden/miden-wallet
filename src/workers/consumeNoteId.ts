import { Observable } from 'threads/observable';
import { expose } from 'threads/worker';

import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';

export type WorkerMessage = { type: 'connectivity_issue' } | { type: 'result'; payload: Uint8Array };

function consumeNoteId(transactionResultBytes: Uint8Array, delegateTransaction?: boolean): Observable<WorkerMessage> {
  return new Observable(observer => {
    (async () => {
      console.log('[consumeNoteId Worker] Starting, bytes length:', transactionResultBytes.length);
      try {
        console.log('[consumeNoteId Worker] Acquiring WASM lock...');
        await withWasmClientLock(async () => {
          console.log('[consumeNoteId Worker] Lock acquired, getting client...');
          const handleConnectivityIssue = () => {
            console.log('[consumeNoteId Worker] Detected connectivity issue. Emitting event.');
            observer.next({ type: 'connectivity_issue' });
          };

          const midenClient = await getMidenClient({
            onConnectivityIssue: handleConnectivityIssue
          });
          console.log('[consumeNoteId Worker] Client obtained, submitting transaction...');

          await midenClient.submitTransaction(transactionResultBytes, delegateTransaction);
          console.log('[consumeNoteId Worker] Transaction submitted successfully');

          observer.next({ type: 'result', payload: transactionResultBytes });

          observer.complete();
        });
        console.log('[consumeNoteId Worker] Lock released');
      } catch (e) {
        console.error('[consumeNoteId Worker] Error:', e);
        observer.error(e);
      }
    })();
  });
}

export type ConsumeNoteIdWorker = typeof consumeNoteId;

expose(consumeNoteId);
