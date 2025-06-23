import { TransactionResult } from '@demox-labs/miden-sdk';

import { ampApi } from 'lib/amp/amp-interface';
import { consumeNoteId } from 'lib/miden-worker/consumeNoteId';
import { sendTransaction } from 'lib/miden-worker/sendTransaction';
import { submitTransactionRequest } from 'lib/miden-worker/submitTransactionRequest';
import * as Repo from 'lib/miden/repo';
import { logger } from 'shared/logger';

import { ConsumeTransaction, ITransaction, ITransactionStatus, SendTransaction, Transaction } from '../db/types';
import { toNoteTypeString } from '../helpers';
import { NoteExportType } from '../sdk/constants';
import { MidenClientInterface } from '../sdk/miden-client-interface';
import { NoteTypeEnum, NoteType as NoteTypeString } from '../types';
import { interpretTransactionResult } from './helpers';
import { importAllNotes, queueNoteImport, registerOutputNote } from './notes';

export const MAX_WAIT_BEFORE_CANCEL = 30 * 60_000; // 30 minutes

export const requestCustomTransaction = async (
  accountId: string,
  transactionRequestBytes: string,
  inputNoteIds?: string[],
  importNotes?: string[],
  delegateTransaction?: boolean
): Promise<string> => {
  const byteArray = new Uint8Array(Buffer.from(transactionRequestBytes, 'base64'));
  const transaction = new Transaction(accountId, byteArray, inputNoteIds, delegateTransaction);
  await Repo.transactions.add(transaction);

  if (importNotes) {
    const imports = importNotes.map(async noteBytes => {
      queueNoteImport(noteBytes);
    });

    await Promise.all(imports);
  }

  return transaction.id;
};

export const completeCustomTransaction = async (transaction: ITransaction, result: TransactionResult) => {
  const outputNotes = result.createdNotes().notes();
  const registerExports = outputNotes.map(async note => {
    if (toNoteTypeString(note.metadata().noteType()) === NoteTypeEnum.Private) {
      registerOutputNote(note.id().toString());
    }
  });
  await Promise.all(registerExports);

  const updatedTransaction = interpretTransactionResult(transaction, result);
  updatedTransaction.completedAt = Date.now() / 1000; // Convert to seconds

  await updateTransactionStatus(transaction.id, ITransactionStatus.Completed, updatedTransaction);
};

export const initiateConsumeTransaction = async (
  accountId: string,
  noteId: string,
  delegateTransaction?: boolean
): Promise<string> => {
  const dbTransaction = new ConsumeTransaction(accountId, noteId, delegateTransaction);
  await Repo.transactions.add(dbTransaction);

  return dbTransaction.id;
};

export const completeConsumeTransaction = async (id: string, result: TransactionResult) => {
  const note = result.consumedNotes().getNote(0).note();
  const sender = note.metadata().sender().toBech32();
  const executedTransaction = result.executedTransaction();

  const dbTransaction = await Repo.transactions.where({ id }).first();
  const reclaimed = dbTransaction?.accountId === sender;
  const displayMessage = reclaimed ? 'Reclaimed' : 'Received';
  const secondaryAccountId = reclaimed ? undefined : sender;
  const asset = note.assets().fungibleAssets()[0];
  const faucetId = asset.faucetId().toBech32();
  const amount = asset.amount();

  await updateTransactionStatus(id, ITransactionStatus.Completed, {
    displayMessage,
    transactionId: executedTransaction.id().toHex(),
    secondaryAccountId,
    faucetId,
    amount,
    noteType: toNoteTypeString(note.metadata().noteType()),
    completedAt: Date.now() / 1000 // Convert to seconds.
  });
};

export const initiateSendTransaction = async (
  senderAccountId: string,
  recipientAccountId: string,
  faucetId: string,
  noteType: NoteTypeString,
  amount: bigint,
  recallBlocks?: number,
  delegateTransaction?: boolean
): Promise<string> => {
  const dbTransaction = new SendTransaction(
    senderAccountId,
    amount,
    recipientAccountId,
    faucetId,
    noteType,
    recallBlocks,
    delegateTransaction
  );
  await Repo.transactions.add(dbTransaction);

  return dbTransaction.id;
};

export const completeSendTransaction = async (tx: SendTransaction, result: TransactionResult) => {
  const noteId = result.createdNotes().notes()[0].id().toString();
  if (tx.noteType === NoteTypeEnum.Private) {
    const midenClient = await MidenClientInterface.create();
    const noteBytes = await midenClient.exportNote(noteId, NoteExportType.PARTIAL);
    console.log('registering output note', noteId);
    await registerOutputNote(noteId);
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
    transactionId: result.executedTransaction().id().toHex(),
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
  let resultBytes: Uint8Array;
  let result: TransactionResult;
  switch (transaction.type) {
    case 'send':
      resultBytes = await sendTransaction(transaction as SendTransaction);
      result = TransactionResult.deserialize(resultBytes);
      await completeSendTransaction(transaction as SendTransaction, result);
      break;
    case 'consume':
      resultBytes = await consumeNoteId(transaction as ConsumeTransaction);
      result = TransactionResult.deserialize(resultBytes);
      await completeConsumeTransaction(transaction.id, result);
      break;
    case 'execute':
    default:
      resultBytes = await submitTransactionRequest(
        transaction.accountId,
        new Uint8Array(transaction.requestBytes!),
        transaction.delegateTransaction
      );
      result = TransactionResult.deserialize(resultBytes);
      await completeCustomTransaction(transaction, result);
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

export const getTransactionById = async (id: string) => {
  const tx = await Repo.transactions.where({ id }).first();
  if (!tx) throw new Error('Transaction not found');
  return tx;
};

export const generateTransactionsLoop = async () => {
  await cancelStuckTransactions();

  // Import any notes needed for queued transactions
  await importAllNotes();

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
