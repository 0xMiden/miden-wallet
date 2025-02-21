import Dexie, { Transaction } from 'dexie';

import { ITransactionRequest, ITransaction } from './db/types';

export enum Table {
  Transactions = 'transactions'
}

export const db = new Dexie('TridentMain');

db.version(1)
  .stores({
    transactionRequests: indexes('id', 'accountId', 'initiatedAt', 'completedAt')
  })
  .upgrade(async (tx: Transaction) => {
    await tx.db.table<ITransactionRequest, string>('transactionRequests').clear();
  });

db.version(1.1)
  .stores({
    [Table.Transactions]: indexes('id', 'accountId', 'transactionId', 'initiatedAt', 'completedAt'),
    transactionRequests: null
  })
  .upgrade(async (tx: Transaction) => {
    await tx.db.table<ITransactionRequest, string>('transactionRequests').clear();
    await tx.db.table<ITransaction, string>(Table.Transactions).clear();
  });

export const transactions = db.table<ITransaction, string>(Table.Transactions);

function indexes(...items: string[]) {
  return items.join(',');
}
