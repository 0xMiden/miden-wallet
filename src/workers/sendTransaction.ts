import { Observable } from 'threads/observable';
import { expose } from 'threads/worker';

import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';

export type WorkerMessage = { type: 'connectivity_issue' } | { type: 'result'; payload: Uint8Array };

function sendTransaction(transactionResultBytes: Uint8Array, delegateTransaction?: boolean): Observable<WorkerMessage> {
  return new Observable(observer => {
    (async () => {
      console.log('[sendTransaction Worker] Starting, bytes length:', transactionResultBytes.length);
      try {
        console.log('[sendTransaction Worker] Acquiring WASM lock...');
        await withWasmClientLock(async () => {
          console.log('[sendTransaction Worker] Lock acquired, getting client...');
          const midenClient = await getMidenClient({
            onConnectivityIssue: () => {
              console.log('[sendTransaction Worker] Connectivity issue detected');
              observer.next({ type: 'connectivity_issue' });
            }
          });
          console.log('[sendTransaction Worker] Client obtained, submitting transaction...');
          await midenClient.submitTransaction(transactionResultBytes, delegateTransaction);
          console.log('[sendTransaction Worker] Transaction submitted successfully');
          observer.next({ type: 'result', payload: transactionResultBytes });
        });
        console.log('[sendTransaction Worker] Lock released');
      } catch (err) {
        console.error('[sendTransaction Worker] Error:', err);
        observer.error(err);
      }
    })();
  });
}

export type SendTransactionWorker = typeof sendTransaction;

expose(sendTransaction);
