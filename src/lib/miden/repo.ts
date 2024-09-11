import Dexie, { Transaction } from 'dexie';

import { ITransition, ITransaction } from './db/transaction-types';
import {
  IRecord,
  ISerialNumberSync,
  IRecordIdSync,
  IOwnedRecord,
  IAccountCreationBlockHeight,
  IPublicSync
} from './db/types';

export enum Table {
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

export const db = new Dexie('MidenMain');

db.version(1)
  .stores({
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
    [Table.Transactions]: indexes('id', 'transactionId', 'chainId', 'address', 'initiatedAt', 'completedAt'),
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
    [Table.AccountCreationBlockHeights]: indexes('++id', '[chainId+address]'),
    [Table.PublicSyncs]: indexes('[chainId+address]')
  })
  .upgrade(async (tx: Transaction) => {
    await tx.db.table<IRecord, string>(Table.Records).clear();
    await tx.db.table<ITransaction, string>(Table.Transactions).clear();
    await tx.db.table<ITransition, string>(Table.Transitions).clear();
    await tx.db.table<IKeyFile, string>(Table.KeyFiles).clear();
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
