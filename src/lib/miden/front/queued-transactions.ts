import { useCallback } from 'react';

import { ConsumeNoteIdWorker } from 'lib/miden-worker/consumeNoteId';
import { SendTransactionWorker } from 'lib/miden-worker/sendTransaction';
import { logger } from 'shared/logger';

import { QueuedTransaction, QueuedTransactionType } from '../types';
import { fetchFromStorage, putToStorage, useStorage } from './storage';

const QUEUED_TRANSACTIONS_KEY = 'miden-queued-transactions';

export const useQueuedTransactions = (): [QueuedTransaction[], (transaction: QueuedTransaction) => void] => {
  const [queuedTransactions, setQueuedTransactions] = useStorage<QueuedTransaction[]>(QUEUED_TRANSACTIONS_KEY, []);

  const queueTransaction = useCallback(
    (transaction: QueuedTransaction) => {
      console.log('queueTransaction', transaction);
      setQueuedTransactions([...queuedTransactions, transaction]);
    },
    [queuedTransactions, setQueuedTransactions]
  );

  return [queuedTransactions, queueTransaction];
};

export const safeGenerateTransactionsLoop = (
  consumeNoteId: ConsumeNoteIdWorker,
  sendTransaction: SendTransactionWorker
) => {
  return navigator.locks
    .request(`generate-transactions-loop`, { ifAvailable: true }, async lock => {
      if (!lock) return;

      await generateTransactionsLoop(consumeNoteId, sendTransaction);
    })
    .catch(e => {
      console.log(e);
      logger.error('Error in safe generate transactions loop', e);
    });
};

export const generateTransactionsLoop = async (
  consumeNoteId: ConsumeNoteIdWorker,
  sendTransaction: SendTransactionWorker
) => {
  const transactions = await fetchFromStorage(QUEUED_TRANSACTIONS_KEY);
  const [nextTransaction, ...rest] = transactions;
  if (!nextTransaction) return;

  const { type, data } = nextTransaction;

  switch (type) {
    case QueuedTransactionType.ConsumeNoteId:
      console.log('generating consumeNoteId', data);
      await consumeNoteId(data.address, data.noteId, data.delegateTransaction);
      break;
    case QueuedTransactionType.SendTransaction:
      console.log('generating sendTransaction', data);
      await sendTransaction(
        data.senderAccountId,
        data.recipientAccountId,
        data.faucetId,
        data.noteType,
        data.amount,
        data.recallBlocks,
        data.delegateTransaction
      );
      break;
  }

  putToStorage(QUEUED_TRANSACTIONS_KEY, rest);
};
