import { submitTransactionRequest } from 'lib/miden-worker/submitTransactionRequest';
import * as Repo from 'lib/miden/repo';
import { logger } from 'shared/logger';

import { Transaction, ITransactionStatus, ITransaction } from '../db/types';

export const MAX_WAIT_BEFORE_CANCEL = 30 * 60_000; // 30 minutes

export const requestCustomTransaction = async (accountId: string, transactionRequestBytes: string) => {
  console.log('storing custom transaction', transactionRequestBytes);
  const byteArray = new Uint8Array(Buffer.from(transactionRequestBytes, 'base64'));
  console.log(byteArray);
  const transaction = new Transaction('execute', accountId, byteArray);
  await Repo.transactions.add(transaction);
};

export const requestMintTransaction = async (
  recipientAccountId: string,
  faucetId: string,
  noteType: string,
  amount: bigint
) => {
  // add transaction request to db
};

export const requestSendTransaction = async (
  recipienctAccountId: string,
  faucetId: string,
  noteType: string,
  amount: bigint
) => {
  // add transaction request to db
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

export type SubmitTransaction = (accPublicKey: string, transactionRequestBytes: Uint8Array) => Promise<void>;

export const generateTransaction = async (transaction: Transaction) => {
  // Mark transaction as in progress
  await updateTransactionStatus(transaction.id, ITransactionStatus.GeneratingTransaction, {
    processingStartedAt: Date.now()
  });

  // Process transaction
  const result = await submitTransactionRequest(transaction.accountId, new Uint8Array(transaction.requestBytes!));
  console.log('Transaction result', result);

  // Mark transaction as completed
  await updateTransactionStatus(transaction.id, ITransactionStatus.Completed, {
    completedAt: Date.now() / 1000 // Convert to seconds.
    //resultBytes: result.serialize()
  });
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
