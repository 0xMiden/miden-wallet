import { NoteType } from '@demox-labs/miden-sdk';
import { TransactionResult } from '@demox-labs/miden-sdk/dist/crates/miden_client_web';

import { ampApi } from 'lib/amp/amp-interface';
import { consumeNoteId } from 'lib/miden-worker/consumeNoteId';
import { sendTransaction } from 'lib/miden-worker/sendTransaction';
import { submitTransactionRequest } from 'lib/miden-worker/submitTransactionRequest';
import * as Repo from 'lib/miden/repo';
import { logger } from 'shared/logger';

import {
  ConsumeTransaction,
  INoteType,
  ITransaction,
  ITransactionStatus,
  SendTransaction,
  Transaction
} from '../db/types';
import { NoteExportType } from '../sdk/constants';
import { MidenClientInterface } from '../sdk/miden-client-interface';
import { toNoteTypeString } from './helpers';
import { queueNoteImport, regiserOutputNote } from './notes';

export const MAX_WAIT_BEFORE_CANCEL = 30 * 60_000; // 30 minutes

export const requestCustomTransaction = async (
  accountId: string,
  transactionRequestBytes: string,
  inputNoteIds?: string[],
  importNotes?: string[]
): Promise<string> => {
  console.log('storing custom transaction', transactionRequestBytes);
  const byteArray = new Uint8Array(Buffer.from(transactionRequestBytes, 'base64'));
  const transaction = new Transaction(accountId, byteArray, inputNoteIds);
  await Repo.transactions.add(transaction);

  if (importNotes) {
    importNotes.forEach(noteBytes => {
      queueNoteImport(noteBytes);
    });
  }

  return transaction.id;
};

export const completeCustomTransaction = async (id: string, result: TransactionResult) => {
  const inputNotes = result.consumed_notes().notes();
  const outputNotes = result.created_notes().notes();
  const outputNoteIds = outputNotes.map(note => note.id().to_string());
  outputNoteIds.forEach(noteId => regiserOutputNote(noteId));
  const executedTransaction = result.executed_transaction();

  await updateTransactionStatus(id, ITransactionStatus.Completed, {
    transactionId: executedTransaction.id().to_hex(),
    inputNoteIds: inputNotes.map(note => note.id().to_string()),
    outputNoteIds,
    completedAt: Date.now() / 1000 // Convert to seconds.
  });
};

export const initiateConsumeTransaction = async (accountId: string, noteId: string): Promise<string> => {
  const dbTransaction = new ConsumeTransaction(accountId, noteId);
  await Repo.transactions.add(dbTransaction);

  return dbTransaction.id;
};

export const completeConsumeTransaction = async (id: string, result: TransactionResult) => {
  const note = result.consumed_notes().get_note(0).note();
  const sender = note.metadata().sender().to_string();
  const executedTransaction = result.executed_transaction();

  const dbTransaction = await Repo.transactions.where({ id }).first();
  const reclaimed = dbTransaction?.accountId === sender;
  const displayMessage = reclaimed ? 'Reclaimed' : 'Received';
  const secondaryAccountId = reclaimed ? undefined : sender;
  const asset = note.assets().assets()[0];
  const faucetId = asset.faucet_id().to_string();
  const amount = asset.amount();

  await updateTransactionStatus(id, ITransactionStatus.Completed, {
    displayMessage,
    transactionId: executedTransaction.id().to_hex(),
    secondaryAccountId,
    faucetId,
    amount,
    noteType: toNoteTypeString(note.metadata().note_type()),
    completedAt: Date.now() / 1000 // Convert to seconds.
  });
};

export const initiateSendTransaction = async (
  senderAccountId: string,
  recipientAccountId: string,
  faucetId: string,
  noteType: INoteType,
  amount: bigint,
  recallBlocks?: number
): Promise<string> => {
  const dbTransaction = new SendTransaction(
    senderAccountId,
    amount,
    recipientAccountId,
    faucetId,
    noteType,
    recallBlocks
  );
  await Repo.transactions.add(dbTransaction);

  return dbTransaction.id;
};

export const completeSendTransaction = async (tx: SendTransaction, result: TransactionResult) => {
  const outputNote = result.created_notes().notes()[0];
  const noteId = result.created_notes().notes()[0].id().to_string();
  if (outputNote.metadata().note_type() === NoteType.private()) {
    const midenClient = await MidenClientInterface.create();
    const noteBytes = await midenClient.exportNote(noteId, NoteExportType.PARTIAL);
    regiserOutputNote(noteId);

    // TODO: Potentially unhook this from export process
    try {
      await ampApi.postMessage({
        recipient: tx.secondaryAccountId,
        body: noteBytes.toString()
      });
      console.log('Sent note to AMP');
    } catch (e) {
      console.error('Failed to send note to AMP', e);
    }
  }
  await updateTransactionStatus(tx.id, ITransactionStatus.Completed, {
    displayMessage: 'Sent',
    transactionId: result.executed_transaction().id().to_hex(),
    outputNoteIds: [noteId],
    completedAt: Date.now() / 1000 // Convert to seconds.
  });
};

/**
 * Update the status of the transaction
 * @param id The id of the transaction to update
 * @throws if the transaction has been cancelled
 */
export const updateTransactionStatus = async <K extends keyof ITransaction>(
  id: string,
  status: ITransactionStatus,
  otherValues: Pick<ITransaction, K>
) => {
  const tx = await Repo.transactions.where({ id }).first();
  if (!tx) throw new Error('No transaction found to update');
  if (tx.status === ITransactionStatus.Failed || tx.status === ITransactionStatus.Completed) {
    throw new Error('Transaction already in a finalized state');
  }

  await Repo.transactions.where({ id: id }).modify(t => {
    Object.assign(t, otherValues);
    t.status = status;
  });
};

export const hasQueuedTransactions = async () => {
  const tx = await Repo.transactions.filter(rec => rec.status === ITransactionStatus.Queued).toArray();
  return tx.length > 0;
};

export const getUncompletedTransactions = async (address: string) => {
  const statuses = [ITransactionStatus.Queued, ITransactionStatus.GeneratingTransaction];
  return await getTransactionsInStatuses(statuses, address);
};

const getTransactionsInStatuses = async (statuses: ITransactionStatus[], accountId: string) => {
  let txs = await Repo.transactions.filter(rec => statuses.includes(rec.status)).toArray();
  txs.sort((tx1, tx2) => tx1.initiatedAt - tx2.initiatedAt);
  txs = txs.filter(tx => tx.accountId === accountId);

  return txs;
};

export const getTransactionsInProgress = async (): Promise<Transaction[]> => {
  const txs = await Repo.transactions.filter(rec => rec.status === ITransactionStatus.GeneratingTransaction).toArray();
  txs.sort((tx1, tx2) => tx1.initiatedAt - tx2.initiatedAt);
  return txs;
};

export const getAllUncompletedTransactions = async () => {
  const txs = await Repo.transactions
    .filter(rec => rec.status === ITransactionStatus.GeneratingTransaction || rec.status === ITransactionStatus.Queued)
    .toArray();
  txs.sort((tx1, tx2) => tx1.initiatedAt - tx2.initiatedAt);
  return txs;
};

export const getFailedTransactions = async () => {
  const transactions = await Repo.transactions.filter(tx => tx.status === ITransactionStatus.Failed).toArray();
  transactions.sort((tx1, tx2) => tx1.initiatedAt - tx2.initiatedAt);
  return transactions;
};

export const getCompletedTransactions = async (
  accountId: string,
  offset?: number,
  limit?: number,
  includeFailed: boolean = false
) => {
  let transactions = await Repo.transactions.filter(tx => tx.status === ITransactionStatus.Completed).toArray();
  if (includeFailed) {
    const failedTransactions = await getFailedTransactions();
    transactions = transactions.concat(failedTransactions);
  }
  transactions.sort((tx1, tx2) => (tx1.completedAt || tx1.initiatedAt) - (tx2.completedAt || tx2.initiatedAt));
  transactions = transactions.filter(tx => tx.accountId === accountId);

  return transactions.slice(offset, limit);
};

/**
 * Cancel all of the transactions (& their transitions) that are taking too long to process
 */
export const cancelStuckTransactions = async () => {
  const transactions = await getTransactionsInProgress();
  const cancelTransactionUpdates = transactions
    .filter(tx => {
      return tx.processingStartedAt && Date.now() - tx.processingStartedAt > MAX_WAIT_BEFORE_CANCEL;
    })
    .map(async tx => cancelTransaction(tx));

  await Promise.all(cancelTransactionUpdates);
};

export const generateTransaction = async (transaction: Transaction) => {
  // Mark transaction as in progress
  await updateTransactionStatus(transaction.id, ITransactionStatus.GeneratingTransaction, {
    processingStartedAt: Date.now()
  });

  // Process transaction
  let result: TransactionResult;
  switch (transaction.type) {
    case 'send':
      result = await sendTransaction(transaction as SendTransaction);
      await completeSendTransaction(transaction as SendTransaction, result);
      break;
    case 'consume':
      console.log('consuming note id', (transaction as ConsumeTransaction).noteId);
      result = await consumeNoteId(transaction as ConsumeTransaction);
      await completeConsumeTransaction(transaction.id, result);
      break;
    case 'execute':
    default:
      result = await submitTransactionRequest(transaction.accountId, new Uint8Array(transaction.requestBytes!));
      await completeCustomTransaction(transaction.id, result);
      break;
  }
};

export const cancelTransaction = async (transaction: Transaction) => {
  // Cancel the transaction
  await Repo.transactions.where({ id: transaction.id }).modify(dbTx => {
    dbTx.completedAt = Date.now() / 1000; // Convert to seconds
    dbTx.status = ITransactionStatus.Failed;
  });
};

export const cancelTransactionById = async (id: string) => {
  const tx = await Repo.transactions.where({ id }).first();
  if (tx) await cancelTransaction(tx);
};

export const generateTransactionsLoop = async () => {
  await cancelStuckTransactions();

  // Wait for other in progress transactions
  const inProgressTransactions = await getTransactionsInProgress();
  if (inProgressTransactions.length > 0) {
    return;
  }

  // Find transactions waiting to process
  const queuedTransactions = await Repo.transactions.filter(rec => rec.status === ITransactionStatus.Queued).toArray();
  queuedTransactions.sort((tx1, tx2) => tx1.initiatedAt - tx2.initiatedAt);
  if (queuedTransactions.length === 0) {
    return;
  }

  // Process next transaction
  const nextTransaction = queuedTransactions[0];

  // Call safely to cancel transaction and unlock records if something goes wrong
  try {
    await generateTransaction(nextTransaction);
  } catch (e) {
    logger.warning('Failed to generate transaction', e);
    console.log(e);
    // Cancel the transaction if it hasn't already been cancelled
    const tx = await Repo.transactions.where({ id: nextTransaction.id }).first();
    if (tx && tx.status !== ITransactionStatus.Failed) await cancelTransaction(tx);
  }
};

export const safeGenerateTransactionsLoop = async () => {
  return navigator.locks
    .request(`generate-transactions-loop`, { ifAvailable: true }, async lock => {
      if (!lock) return;

      await generateTransactionsLoop();
    })
    .catch(e => {
      console.log(e);
      logger.error('Error in safe generate transactions loop', e);
    });
};
