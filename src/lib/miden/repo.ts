import Dexie, { Transaction } from 'dexie';

import { ITransactionRequest } from './db/types';

export enum Table {
  TransactionRequests = 'transactionRequests'
}

export const db = new Dexie('TridentMain');

db.version(1)
  .stores({
    [Table.TransactionRequests]: indexes('id', 'accountId', 'initiatedAt', 'completedAt')
  })
  .upgrade(async (tx: Transaction) => {
    await tx.db.table<ITransactionRequest, string>(Table.TransactionRequests).clear();
  });

export const transactionRequests = db.table<ITransactionRequest, string>(Table.TransactionRequests);

function indexes(...items: string[]) {
  return items.join(',');
}
