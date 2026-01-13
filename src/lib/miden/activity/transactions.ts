import { Address, Note, TransactionResult } from '@demox-labs/miden-sdk';
import { liveQuery } from 'dexie';

import { consumeNoteId } from 'lib/miden-worker/consumeNoteId';
import { sendTransaction } from 'lib/miden-worker/sendTransaction';
import { submitTransaction } from 'lib/miden-worker/submitTransaction';
import * as Repo from 'lib/miden/repo';
import { logger } from 'shared/logger';

import { ConsumeTransaction, ITransaction, ITransactionStatus, SendTransaction, Transaction } from '../db/types';
import { toNoteTypeString } from '../helpers';
import { getBech32AddressFromAccountId } from '../sdk/helpers';
import { getMidenClient, withWasmClientLock } from '../sdk/miden-client';
import { MidenClientCreateOptions } from '../sdk/miden-client-interface';
import { ConsumableNote, NoteTypeEnum, NoteType as NoteTypeString } from '../types';
import { interpretTransactionResult } from './helpers';
import { importAllNotes, queueNoteImport, registerOutputNote } from './notes';

export const MAX_WAIT_BEFORE_CANCEL = 30 * 60_000; // 30 minutes

export const requestCustomTransaction = async (
  accountId: string,
  transactionRequestBytes: string,
  inputNoteIds?: string[],
  importNotes?: string[],
  delegateTransaction?: boolean,
  recipientAccountId?: string
): Promise<string> => {
  const byteArray = new Uint8Array(Buffer.from(transactionRequestBytes, 'base64'));
  const transaction = new Transaction(accountId, byteArray, inputNoteIds, delegateTransaction, recipientAccountId);
  await Repo.transactions.add(transaction);

  if (importNotes) {
    for (const noteBytes of importNotes) {
      await queueNoteImport(noteBytes);
    }
  }

  return transaction.id;
};

export const completeCustomTransaction = async (transaction: ITransaction, result: TransactionResult) => {
  const executedTx = result.executedTransaction();
  const outputNotes = executedTx.outputNotes().notes();

  for (const note of outputNotes) {
    // Only care about private notes
    if (toNoteTypeString(note.metadata().noteType()) !== NoteTypeEnum.Private) {
      continue;
    }

    if (!transaction.secondaryAccountId) {
      console.error('Missing recipient account id for private note', { txId: transaction.id });
      continue;
    }

    console.log('registering output note', note.id().toString());
    await registerOutputNote(note.id().toString());

    let fullNote: Note;

    // intoFull() can throw or return undefined
    try {
      const maybeFullNote = note.intoFull();
      if (!maybeFullNote) {
        console.error('intoFull() returned undefined for output note');
        continue;
      }
      fullNote = maybeFullNote;
    } catch (error) {
      console.error('Failed to convert output note into full note', { error });
      continue;
    }

    // Get client + send private note (wrapped in lock to prevent concurrent WASM access)
    try {
      await withWasmClientLock(async () => {
        const midenClient = await getMidenClient();

        try {
          await midenClient.waitForTransactionCommit(executedTx.id().toHex());
          console.log('Sending private note through the transport layer...');
          const recipientAccountAddress = Address.fromBech32(transaction.secondaryAccountId!);
          await midenClient.sendPrivateNote(fullNote, recipientAccountAddress);
        } catch (error) {
          console.error('Failed to send private note through the transport layer', {
            txId: transaction.id,
            secondaryAccountId: transaction.secondaryAccountId,
            error
          });
        }
      });
    } catch (error) {
      console.error('Failed to initialize Miden client for private note send', {
        txId: transaction.id,
        error
      });
    }
  }

  const updatedTransaction = interpretTransactionResult(transaction, result);
  updatedTransaction.completedAt = Math.floor(Date.now() / 1000); // seconds

  await updateTransactionStatus(transaction.id, ITransactionStatus.Completed, updatedTransaction);
};

export const initiateConsumeTransactionFromId = async (
  accountId: string,
  noteId: string,
  delegateTransaction?: boolean
): Promise<string> => {
  const note: ConsumableNote = {
    id: noteId,
    faucetId: '',
    amount: '',
    senderAddress: '',
    isBeingClaimed: false
  };

  return await initiateConsumeTransaction(accountId, note, delegateTransaction);
};

export const initiateConsumeTransaction = async (
  accountId: string,
  note: ConsumableNote,
  delegateTransaction?: boolean
): Promise<string> => {
  const dbTransaction = new ConsumeTransaction(accountId, note, delegateTransaction);
  const uncompletedTransactions = await getUncompletedTransactions(accountId);
  const existingTransaction = uncompletedTransactions.find(tx => tx.type === 'consume' && tx.noteId === note.id);
  if (existingTransaction) {
    return existingTransaction.id;
  }

  await Repo.transactions.add(dbTransaction);

  return dbTransaction.id;
};

export const waitForConsumeTx = async (id: string, signal?: AbortSignal): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const subscription = liveQuery(() => Repo.transactions.where({ id }).first()).subscribe(tx => {
      if (!tx) {
        subscription.unsubscribe();
        reject(new Error('Transaction not found'));
        return;
      }

      if (tx.status === ITransactionStatus.Completed) {
        subscription.unsubscribe();
        resolve(tx.transactionId!);
      } else if (tx.status === ITransactionStatus.Failed) {
        subscription.unsubscribe();
        reject(new Error('Consume transaction failed'));
      }
    });

    signal?.addEventListener('abort', () => {
      subscription.unsubscribe();
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
};

export const completeConsumeTransaction = async (id: string, result: TransactionResult) => {
  const note = result.executedTransaction().inputNotes().notes()[0].note();
  const sender = getBech32AddressFromAccountId(note.metadata().sender());
  const executedTransaction = result.executedTransaction();

  const dbTransaction = await Repo.transactions.where({ id }).first();
  const reclaimed = dbTransaction?.accountId === sender;
  const displayMessage = reclaimed ? 'Reclaimed' : 'Received';
  const secondaryAccountId = reclaimed ? undefined : sender;
  const asset = note.assets().fungibleAssets()[0];
  const faucetId = getBech32AddressFromAccountId(asset.faucetId());
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

const extractFullNote = (result: TransactionResult): Note | undefined => {
  try {
    const outputNotes = result.executedTransaction().outputNotes().notes();

    if (!outputNotes || outputNotes.length === 0) {
      console.error('No output notes found for executed transaction');
      return undefined;
    }

    const fullNote = outputNotes[0].intoFull();

    if (!fullNote) {
      console.error('intoFull() returned undefined for first output note');
      return undefined;
    }

    return fullNote;
  } catch (error) {
    console.error('Failed to extract full note from transaction result', { error });
    return undefined;
  }
};

export const completeSendTransaction = async (tx: SendTransaction, result: TransactionResult) => {
  const executedTx = result.executedTransaction();
  const note = extractFullNote(result);
  const noteId = note?.id().toString();
  const outputNoteIds = noteId ? [noteId] : [];

  if (tx.noteType === NoteTypeEnum.Private && note && noteId) {
    console.log('registering output note', noteId);
    await registerOutputNote(noteId);

    // Wrap all WASM client operations in a lock to prevent concurrent access
    type SendResult = { success: true } | { success: false; errorType: 'init' | 'transport'; error: unknown };
    const sendResult = await withWasmClientLock<SendResult>(async () => {
      try {
        const midenClient = await getMidenClient();
        await midenClient.waitForTransactionCommit(executedTx.id().toHex());
        console.log('Sending private note through the transport layer...');
        const recipientAccountAddress = Address.fromBech32(tx.secondaryAccountId);
        await midenClient.sendPrivateNote(note, recipientAccountAddress);
        console.log('Private note sent!');
        return { success: true };
      } catch (error) {
        return { success: false, errorType: 'transport', error };
      }
    }).catch(error => ({ success: false, errorType: 'init' as const, error }));

    if (!sendResult.success) {
      if (sendResult.errorType === 'transport') {
        console.error('Failed to send private note through the transport layer', {
          txId: tx.id,
          secondaryAccountId: tx.secondaryAccountId,
          error: sendResult.error
        });
        await updateTransactionStatus(tx.id, ITransactionStatus.Failed, {
          displayMessage: 'Send failed: transport error',
          displayIcon: 'FAILED',
          transactionId: executedTx.id().toHex(),
          outputNoteIds,
          completedAt: Math.floor(Date.now() / 1000) // seconds
        });
      } else {
        console.error('Failed to initialize Miden client for private note send', {
          txId: tx.id,
          error: sendResult.error
        });
        await updateTransactionStatus(tx.id, ITransactionStatus.Failed, {
          displayMessage: 'Send failed: transport init error',
          displayIcon: 'FAILED',
          transactionId: executedTx.id().toHex(),
          outputNoteIds,
          completedAt: Math.floor(Date.now() / 1000) // seconds
        });
      }
      return;
    }
  } else if (tx.noteType === NoteTypeEnum.Private && (!note || !noteId)) {
    console.error('Missing full note for private send', { txId: tx.id });
    await updateTransactionStatus(tx.id, ITransactionStatus.Failed, {
      displayMessage: 'Send failed: note unavailable',
      displayIcon: 'FAILED',
      transactionId: executedTx.id().toHex(),
      outputNoteIds,
      completedAt: Math.floor(Date.now() / 1000) // seconds
    });
    return;
  }

  try {
    await updateTransactionStatus(tx.id, ITransactionStatus.Completed, {
      displayMessage: 'Sent',
      transactionId: executedTx.id().toHex(),
      outputNoteIds,
      completedAt: Math.floor(Date.now() / 1000) // seconds
    });
  } catch (error) {
    console.error('Failed to update transaction status', {
      txId: tx.id,
      error
    });
  }
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

export const generateTransaction = async (
  transaction: Transaction,
  signCallback: (publicKey: string, signingInputs: string) => Promise<Uint8Array>
) => {
  // Mark transaction as in progress
  await updateTransactionStatus(transaction.id, ITransactionStatus.GeneratingTransaction, {
    processingStartedAt: Date.now()
  });

  // Process transaction
  let resultBytes: Uint8Array;
  let result: TransactionResult;
  const options: MidenClientCreateOptions = {
    signCallback: async (publicKey: Uint8Array, signingInputs: Uint8Array) => {
      const keyString = Buffer.from(publicKey).toString('hex');
      const signingInputsString = Buffer.from(signingInputs).toString('hex');
      return await signCallback(keyString, signingInputsString);
    }
  };

  // Wrap WASM client operations in a lock to prevent concurrent access
  const transactionResultBytes = await withWasmClientLock(async () => {
    const midenClient = await getMidenClient(options);
    switch (transaction.type) {
      case 'send':
        return midenClient.sendTransaction(transaction as SendTransaction);
      case 'consume':
        return midenClient.consumeNoteId(transaction as ConsumeTransaction);
      case 'execute':
      default:
        return midenClient.newTransaction(transaction.accountId, transaction.requestBytes!);
    }
  });

  // Worker calls and completion are outside the lock
  switch (transaction.type) {
    case 'send':
      resultBytes = await sendTransaction(transactionResultBytes, transaction.delegateTransaction);
      result = TransactionResult.deserialize(resultBytes);
      await completeSendTransaction(transaction as SendTransaction, result);
      break;
    case 'consume':
      resultBytes = await consumeNoteId(transactionResultBytes, transaction.delegateTransaction);
      result = TransactionResult.deserialize(transactionResultBytes);
      await completeConsumeTransaction(transaction.id, result);
      break;
    case 'execute':
    default:
      resultBytes = await submitTransaction(transactionResultBytes, transaction.delegateTransaction);
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

export const generateTransactionsLoop = async (
  signCallback: (publicKey: string, signingInputs: string) => Promise<Uint8Array>
): Promise<boolean | void> => {
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
    await generateTransaction(nextTransaction, signCallback);
    return true;
  } catch (e) {
    logger.warning('Failed to generate transaction', e);
    console.log(e);
    // Cancel the transaction if it hasn't already been cancelled
    const tx = await Repo.transactions.where({ id: nextTransaction.id }).first();
    if (tx && tx.status !== ITransactionStatus.Failed) await cancelTransaction(tx);
    return false;
  }
};

export const safeGenerateTransactionsLoop = async (
  signCallback: (publicKey: string, signingInputs: string) => Promise<Uint8Array>
) => {
  return navigator.locks
    .request(`generate-transactions-loop`, { ifAvailable: true }, async lock => {
      if (!lock) return;

      const result = await generateTransactionsLoop(signCallback);
      if (result === false) {
        return false;
      }

      // Either a transaction was processed successfully (true)
      // or there was nothing to do / another transaction is in progress (undefined).
      return true;
    })
    .catch(e => {
      console.log(e);
      logger.error('Error in safe generate transactions loop', e);
      return false;
    });
};
