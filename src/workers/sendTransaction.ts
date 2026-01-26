import { Observable } from 'threads/observable';
import { expose } from 'threads/worker';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';

export type WorkerMessage = { type: 'connectivity_issue' } | { type: 'result'; payload: Uint8Array };

function sendTransaction(
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
        });
      } catch (err) {
        console.error('[sendTransaction Worker] Error:', err);
        observer.error(err);
      }
    })();
  });
}

export type SendTransactionWorker = typeof sendTransaction;

expose(sendTransaction);
