import { ITransactionIcon } from 'lib/aleo/db/transaction-types';

export interface IActivity {
  key: string;
  address: string;
  timestamp: number;
  message: string;
  type: ActivityType;

  // Optional properties
  secondaryMessage?: string;
  cancel?: () => Promise<void>;
  explorerLink?: string;
  transactionIcon?: ITransactionIcon;
  txId?: string;
  fee?: string;
}

/// The activity type. For sorting purposes, the order of the activity type matters. In a given transaction
/// within a given block, many activities can occur at the exact same timestamp (multiple records sent and received,
/// as well as coinbase rewards). Lower numbers are displayed as having happened before higher numbers -- e.g. a
/// record spent should sequentially happen before a record received in the same transaction.
export enum ActivityType {
  CoinbaseReward = 0,
  PendingTransaction = 1,
  ProcessingTransaction = 2,
  CompletedTransaction = 3
}
