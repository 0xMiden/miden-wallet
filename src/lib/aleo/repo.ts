import Dexie, { Transaction } from 'dexie';

import { ITransition, ITransaction } from './db/transaction-types';
import {
  IRecord,
  ISerialNumberSync,
  IRecordIdSync,
  IOwnedRecord,
  IAccountCreationBlockHeight,
  IPublicSync,
  IRecordSync
} from './db/types';

export enum Table {
  RecordSyncs = 'recordSyncs', // deprecated, use recordIdSyncs
  RecordIdSyncs = 'recordIdSyncs',
  AccountTokens = 'accountTokens',
  Records = 'records',
  SerialNumberSyncTimes = 'serialNumberSyncTimes',
  KeyFiles = 'keyFiles',
  Transitions = 'transitions',
  Transactions = 'transactions',
  OwnedRecords = 'ownedRecords',
  AccountCreationBlockHeights = 'accountCreationBlockHeights',
  PublicSyncs = 'publicSyncs'
}

export const db = new Dexie('LeoMain');

db.version(4)
  .stores({
    [Table.RecordSyncs]: indexes('++id', '[chainId+address]'),
    [Table.Records]: indexes(
      'id',
      'chainId',
      'address',
      'program_id',
      'spent',
      'timestamp_created',
      'timestamp_spent',
      'locallySyncedTransactions',
      'locked'
    ),
    [Table.AccountTokens]: indexes('', '[chainId+account+type]', '[chainId+type]'),
    [Table.SerialNumberSyncTimes]: indexes('chainId', 'page'),
    [Table.KeyFiles]: indexes('name', 'sourceType', 'lastUsed'),
    [Table.Transitions]: indexes(
      'id',
      'transitionId',
      'transactionDbId',
      'chainId',
      'address',
      'initiatedAt',
      'completedAt'
    ),
    [Table.Transactions]: indexes('id', 'transactionId', 'chainId', 'address', 'initiatedAt', 'completedAt')
  })
  .upgrade(async (tx: Transaction) => {
    await tx.db.table<IRecord, string>(Table.Records).clear();
    await tx.db.table<ITransaction, string>(Table.Transactions).clear();
    await tx.db.table<ITransition, string>(Table.Transitions).clear();
    await tx.db.table<IKeyFile, string>(Table.KeyFiles).clear();
  });

db.version(4.1)
  .stores({
    [Table.Transitions]: indexes(
      'id',
      'transitionId',
      'transactionDbId',
      'chainId',
      'address',
      'isFee',
      'initiatedAt',
      'completedAt'
    ),
    [Table.Transactions]: indexes('id', 'type', 'transactionId', 'chainId', 'address', 'initiatedAt', 'completedAt')
  })
  .upgrade(async (transaction: Transaction) => {
    await transaction.db
      .table<ITransition, string>(Table.Transitions)
      .filter(ts => ts.isFee === undefined)
      .modify(ts => {
        ts.isFee = 0;
      });
    await transaction.db
      .table<ITransaction, string>(Table.Transactions)
      .filter(tx => tx.type === undefined)
      .modify(tx => {
        tx.type = 'execute';
      });
  });

// 4-24-23 Hard fork for testnet3
db.version(4.2).upgrade(async (tx: Transaction) => {
  await tx.db.table<IRecord, string>(Table.Records).clear();
  await tx.db.table<ITransaction, string>(Table.Transactions).clear();
  await tx.db.table<ITransition, string>(Table.Transitions).clear();
  await tx.db.table<IKeyFile, string>(Table.KeyFiles).clear();
  await tx.db.table<IRecordSync, string>(Table.RecordSyncs).clear();
});

// 6-23-23 Hard fork for testnet3
db.version(4.3).upgrade(async (tx: Transaction) => {
  await tx.db.table<IRecord, string>(Table.Records).clear();
  await tx.db.table<ITransaction, string>(Table.Transactions).clear();
  await tx.db.table<ITransition, string>(Table.Transitions).clear();
  await tx.db.table<IKeyFile, string>(Table.KeyFiles).clear();
  await tx.db.table<IRecordSync, string>(Table.RecordSyncs).clear();
});

// 6-29-23 Gpu record scanning
db.version(4.4).stores({
  [Table.OwnedRecords]: indexes(
    'id',
    'chainId',
    'address',
    'transition_id',
    'output_index',
    'synced',
    '[chainId+synced]'
  )
});

// 8-24-23 Account creation block height
db.version(4.5).stores({
  [Table.AccountCreationBlockHeights]: indexes('++id', '[chainId+address]')
});

// 10-23-23 Hard fork for testnet3
db.version(4.6).upgrade(async (tx: Transaction) => {
  await tx.db.table<IRecord, string>(Table.Records).clear();
  await tx.db.table<ITransaction, string>(Table.Transactions).clear();
  await tx.db.table<ITransition, string>(Table.Transitions).clear();
  await tx.db.table<IKeyFile, string>(Table.KeyFiles).clear();
  await tx.db.table<IRecordSync, string>(Table.RecordSyncs).clear();
});

// 10-25-23 Adds Public Syncs table
db.version(4.7).stores({
  [Table.PublicSyncs]: indexes('[chainId+address]')
});

// Fix bug with wrong serial numbers
db.version(4.8).upgrade(async (tx: Transaction) => {
  await tx.db.table<IRecord, string>(Table.Records).clear();
  await tx.db.table<ITransaction, string>(Table.Transactions).clear();
  await tx.db.table<ITransition, string>(Table.Transitions).clear();
  await tx.db.table<IRecordSync, string>(Table.RecordSyncs).clear();
  await tx.db.table<IPublicSync, string>(Table.PublicSyncs).clear();
});

db.version(4.9).upgrade(async (tx: Transaction) => {
  await tx.db.table<IKeyFile, string>(Table.KeyFiles).clear();
});

// 5-29-24 Hard reset for testnetbeta
// Also, db version numbers are multiplied by 10 in indexed db.
// So this is really version 50, not 5.0, bumping up from version 49.
db.version(5.0).upgrade(async (tx: Transaction) => {
  await tx.db.table<IRecord, string>(Table.Records).clear();
  await tx.db.table<ITransaction, string>(Table.Transactions).clear();
  await tx.db.table<ITransition, string>(Table.Transitions).clear();
  await tx.db.table<IKeyFile, string>(Table.KeyFiles).clear();
  await tx.db.table<IRecordSync, string>(Table.RecordSyncs).clear();
  await tx.db
    .table<IAccountCreationBlockHeight, string>(Table.AccountCreationBlockHeights)
    .toCollection()
    .modify(acc => {
      acc.blockHeight = 0;
    });
});

// Enable tagged syncing -- reset the syncing dbs
db.version(5.1).stores({
  [Table.RecordIdSyncs]: indexes('++id', '[chainId+address]'),
  [Table.OwnedRecords]: indexes(
    'id',
    'chainId',
    'address',
    'transition_id',
    'output_index',
    'synced',
    '[chainId+synced]',
    'tag',
    'nonce_x',
    'nonce_y',
    'owner_x'
  ),
  [Table.RecordSyncs]: null // delete record syncs table
});
db.version(5.2).upgrade(async (tx: Transaction) => {
  await tx.db.table<IRecord, string>(Table.Records).clear();
  await tx.db.table<ITransaction, string>(Table.Transactions).clear();
  await tx.db.table<ITransition, string>(Table.Transitions).clear();
  await tx.db.table<IKeyFile, string>(Table.KeyFiles).clear();
  await tx.db.table<IRecordIdSync, string>(Table.RecordIdSyncs).clear();
  await tx.db
    .table<IAccountCreationBlockHeight, string>(Table.AccountCreationBlockHeights)
    .toCollection()
    .modify(acc => {
      acc.blockHeight = 0;
    });
});

// Adding recordId to the creationBlockHeight table.
// Workflows that use it will backfill if the associatedRecordId is 0
db.version(5.3).upgrade(async (tx: Transaction) => {
  await tx.db
    .table<IAccountCreationBlockHeight, string>(Table.AccountCreationBlockHeights)
    .toCollection()
    .modify(acc => {
      acc.associatedRecordId = 0;
    });
});

// 8-6-24 Hard reset for testnetbeta
db.version(5.4).upgrade(async (tx: Transaction) => {
  await tx.db.table<IRecord, string>(Table.Records).clear();
  await tx.db.table<ITransaction, string>(Table.Transactions).clear();
  await tx.db.table<ITransition, string>(Table.Transitions).clear();
  await tx.db.table<IKeyFile, string>(Table.KeyFiles).clear();
  await tx.db.table<IRecordIdSync, string>(Table.RecordIdSyncs).clear();
  await tx.db
    .table<IAccountCreationBlockHeight, string>(Table.AccountCreationBlockHeights)
    .toCollection()
    .modify(acc => {
      acc.blockHeight = 0;
    });
});

db.version(5.5).upgrade(async (tx: Transaction) => {
  await tx.db
    .table<IAccountToken, string>(Table.AccountTokens)
    .toCollection()
    .modify(token => {
      token.tokenId = 'defaultaleotokenid';
    });
});

export const records = db.table<IRecord, string>(Table.Records);
export const recordIdSyncs = db.table<IRecordIdSync, string>(Table.RecordIdSyncs);
export const accountTokens = db.table<IAccountToken, string>(Table.AccountTokens);
export const serialNumberSyncTimes = db.table<ISerialNumberSync, string>(Table.SerialNumberSyncTimes);
export const keyFiles = db.table<IKeyFile, string>(Table.KeyFiles);
export const transitions = db.table<ITransition, string>(Table.Transitions);
export const transactions = db.table<ITransaction, string>(Table.Transactions);
export const ownedRecords = db.table<IOwnedRecord, string>(Table.OwnedRecords);
export const accountCreationBlockHeights = db.table<IAccountCreationBlockHeight, string>(
  Table.AccountCreationBlockHeights
);
export const publicSyncs = db.table<IPublicSync, string>(Table.PublicSyncs);

export function toAccountTokenKey(chainId: string, account: string, tokenSlug: string) {
  return [chainId, account, tokenSlug].join('_');
}

export enum ITokenType {
  Fungible,
  Collectible
}

export enum ITokenStatus {
  Idle,
  Enabled,
  Disabled,
  Removed
}

export interface IAccountToken {
  type: ITokenType;
  chainId: string;
  account: string;
  tokenSlug: string;
  tokenId: string;
  status: ITokenStatus;
  addedAt: number;
  latestBalance?: string;
  latestUSDBalance?: string;
}

export type FileSourceType = 'native' | 'dapp' | 'uploaded';

export interface IKeyFile {
  name: string;
  bytes: Uint8Array;
  sourceType: FileSourceType;
  lastUsed: number;
  url?: string;
  functionName?: string;
}

function indexes(...items: string[]) {
  return items.join(',');
}
