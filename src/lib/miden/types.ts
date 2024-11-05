import { ReadyWalletState, WalletNetwork, WalletState } from 'lib/shared/types';

export interface MidenState extends WalletState {
  networks: MidenNetwork[];
}

export interface ReadyMidenState extends ReadyWalletState {}

export interface MidenNetwork extends WalletNetwork {}

export interface QueuedTransaction {
  type: QueuedTransactionType;
  data: any;
  id?: number;
}

export enum QueuedTransactionType {
  ConsumeNoteId,
  SendTransaction
}

export interface ConsumedNoteIdTransaction {
  address: string;
  noteId: string;
  delegateTransaction: boolean;
}

export interface SendTransactionTransaction {
  senderAccountId: string;
  recipientAccountId: string;
  faucetId: string;
  noteType: string;
  amount: string;
  recallBlocks?: number;
  delegateTransaction: boolean;
}
