import { ITransactionRequestIcon } from 'lib/miden/db/types';

export interface IActivity {
  key: string;
  address: string;
  timestamp: number;
  message: string;
  type: ActivityType;

  // Optional properties
  token?: string;
  amount?: string;
  secondaryAddress?: string;
  cancel?: () => Promise<void>;
  explorerLink?: string;
  transactionIcon?: ITransactionRequestIcon;
  txId?: string;
  fee?: string;
}

/// The activity type. For sorting purposes, the order of the activity type matters. In a given transaction
/// within a given block, many activities can occur at the exact same timestamp (multiple notes sent and received).
/// Lower numbers are displayed as having happened before higher numbers -- e.g. a
/// record spent should sequentially happen before a record received in the same transaction.
export enum ActivityType {
  PendingTransaction = 1,
  ProcessingTransaction = 2,
  CompletedTransaction = 3
}
