import { useCallback } from 'react';

import { ConsumeNoteIdWorker } from 'lib/miden-worker/consumeNoteId';
import { SendTransactionWorker } from 'lib/miden-worker/sendTransaction';
import { logger } from 'shared/logger';

import { QueuedTransaction, QueuedTransactionType } from '../types';
import { fetchFromStorage, putToStorage, useStorage } from './storage';

export const QUEUED_TRANSACTIONS_KEY = 'miden-queued-transactions';
export const EXPORTED_NOTES_KEY = 'miden-exported-notes';
export interface NoteDownload {
  noteId: string;
  downloadUrl: string;
}

export const useQueuedTransactions = (): [
  QueuedTransaction[],
  (transaction: QueuedTransaction) => void,
  NoteDownload[]
] => {
  const [queuedTransactions, setQueuedTransactions] = useStorage<QueuedTransaction[]>(QUEUED_TRANSACTIONS_KEY, []);
  const [exportedNotes] = useStorage<NoteDownload[]>(EXPORTED_NOTES_KEY, []);

  const queueTransaction = useCallback(
    (transaction: QueuedTransaction) => {
      console.log('queueTransaction', transaction);
      setQueuedTransactions([...queuedTransactions, transaction]);
    },
    [queuedTransactions, setQueuedTransactions]
  );

  return [queuedTransactions, queueTransaction, exportedNotes];
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
  const exportedNotes = await fetchFromStorage(EXPORTED_NOTES_KEY);
  const [nextTransaction, ...rest] = transactions;
  if (!nextTransaction) return;

  const { type, data } = nextTransaction;

  try {
    switch (type) {
      case QueuedTransactionType.ConsumeNoteId:
        console.log('generating consumeNoteId', data);
        await consumeNoteId(data.address, data.noteId, data.delegateTransaction);
        break;
      case QueuedTransactionType.SendTransaction:
        console.log('generating sendTransaction', data);
        const exportedNote = await sendTransaction(
          data.senderAccountId,
          data.recipientAccountId,
          data.faucetId,
          data.noteType,
          data.amount,
          data.recallBlocks,
          data.delegateTransaction
        );
        if (exportedNote) {
          const { noteId, noteBytes } = exportedNote;
          const blob = new Blob([noteBytes], { type: 'application/octet-stream' });
          // Create a URL for the Blob
          const downloadUrl = URL.createObjectURL(blob);
          const noteDownload = { noteId, downloadUrl };
          await putToStorage(EXPORTED_NOTES_KEY, [...exportedNotes, noteDownload]);
        }
        break;
    }
  } catch (e) {}

  await putToStorage(QUEUED_TRANSACTIONS_KEY, rest);
};
