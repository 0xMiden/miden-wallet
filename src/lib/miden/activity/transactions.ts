import { submitTransactionRequest } from 'lib/miden-worker/submitTransactionRequest';
import { transactionRequests } from 'lib/miden/repo';
import { logger } from 'shared/logger';

import { ITransactionRequest, ITransactionRequestStatus, TransactionRequest } from '../db/types';

export const MAX_WAIT_BEFORE_CANCEL = 30 * 60_000; // 30 minutes

export const requestCustomTransaction = async (accountId: string, transactionRequestBytes: string) => {
  console.log('storing custom transaction', transactionRequestBytes);
  const byteArray = new Uint8Array(Buffer.from(transactionRequestBytes, 'base64'));
  console.log(byteArray);
  const transactionRequest = new TransactionRequest('0x6f2c28f3a32575200000457d2cfec3', byteArray);
  await transactionRequests.add(transactionRequest);
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
 * Update the status of the transaction request
 * @param id The id of the transaction request to update
 * @throws if the transaction request has been cancelled
 */
const updateTransactionStatus = async <K extends keyof ITransactionRequest>(
  id: string,
  status: ITransactionRequestStatus,
  otherValues: Pick<ITransactionRequest, K>
) => {
  const tx = await transactionRequests.where({ id }).first();
  if (!tx) throw new Error('No transaction request found to update');
  if (tx.status === ITransactionRequestStatus.Failed || tx.status === ITransactionRequestStatus.Completed) {
    throw new Error('Transaction request already in a finalized state');
  }

  await transactionRequests.where({ id: id }).modify(t => {
    Object.assign(t, otherValues);
    t.status = status;
  });
};

export const hasQueuedTransactions = async () => {
  const transactions = await transactionRequests
    .filter(rec => rec.status === ITransactionRequestStatus.Queued)
    .toArray();
  return transactions.length > 0;
};

export const getTransactionsInProgress = async (): Promise<TransactionRequest[]> => {
  const transactions = await transactionRequests
    .filter(rec => rec.status === ITransactionRequestStatus.GeneratingTransaction)
    .toArray();
  transactions.sort((tx1, tx2) => tx1.initiatedAt - tx2.initiatedAt);
  return transactions;
};

export const getAllUncompletedTransactions = async () => {
  const transactions = await transactionRequests
    .filter(
      rec =>
        rec.status === ITransactionRequestStatus.GeneratingTransaction ||
        rec.status === ITransactionRequestStatus.Queued
    )
    .toArray();
  transactions.sort((tx1, tx2) => tx1.initiatedAt - tx2.initiatedAt);
  return transactions;
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

export const generateTransaction = async (transactionRequest: TransactionRequest) => {
  // Mark transaction as in progress
  await updateTransactionStatus(transactionRequest.id, ITransactionRequestStatus.GeneratingTransaction, {
    processingStartedAt: Date.now()
  });

  // Process transaction
  await submitTransactionRequest(transactionRequest.accountId, new Uint8Array(transactionRequest.requestBytes));

  // Mark transaction as completed
  await updateTransactionStatus(transactionRequest.id, ITransactionRequestStatus.Completed, {
    completedAt: Date.now() / 1000 // Convert to seconds
  });
};

export const cancelTransaction = async (transactionRequest: TransactionRequest) => {
  // Cancel the transaction
  await transactionRequests.where({ id: transactionRequest.id }).modify(dbTx => {
    dbTx.completedAt = Date.now() / 1000; // Convert to seconds
    dbTx.status = ITransactionRequestStatus.Failed;
  });
};

export const generateTransactionsLoop = async () => {
  await cancelStuckTransactions();

  // Wait for other in progress transactions
  const inProgressTransactions = await getTransactionsInProgress();
  if (inProgressTransactions.length > 0) {
    return;
  }

  // Find transactions waiting to process
  const queuedTransactions = await transactionRequests
    .filter(rec => rec.status === ITransactionRequestStatus.Queued)
    .toArray();
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
    const tx = await transactionRequests.where({ id: nextTransaction.id }).first();
    if (tx && tx.status !== ITransactionRequestStatus.Failed) await cancelTransaction(tx);
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
