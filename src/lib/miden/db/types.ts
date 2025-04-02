import { v4 as uuid } from 'uuid';

import { NoteType } from '../types';

export interface IInputNote {
  noteId: string;
  noteBytes: Uint8Array;
}

export enum ITransactionStatus {
  Queued,
  GeneratingTransaction,
  Completed,
  Failed
}

export type ITransactionIcon = 'SEND' | 'RECEIVE' | 'SWAP' | 'FAILED' | 'MINT' | 'DEFAULT';
export type ITransactionType = 'send' | 'consume' | 'execute';

export interface ITransaction {
  id: string;
  type: ITransactionType;
  accountId: string;
  amount?: bigint;
  delegateTransaction?: boolean;
  secondaryAccountId?: string;
  faucetId?: string;
  noteId?: string;
  noteType?: NoteType;
  transactionId?: string;
  requestBytes?: Uint8Array;
  status: ITransactionStatus;
  initiatedAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  displayMessage?: string;
  displayIcon: ITransactionIcon;
  inputNoteIds?: string[];
  outputNoteIds?: string[];
  extraInputs?: any;
}

export class Transaction implements ITransaction {
  id: string;
  type: ITransactionType;
  accountId: string;
  amount?: bigint;
  noteType?: NoteType;
  delegateTransaction?: boolean;
  transactionId?: string;
  requestBytes?: Uint8Array;
  inputNoteIds?: string[];
  outputNoteIds?: string[];
  status: ITransactionStatus;
  initiatedAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  displayMessage?: string;
  displayIcon: ITransactionIcon;

  constructor(accountId: string, requestBytes: Uint8Array, inputNoteIds?: string[], delegateTransaction?: boolean) {
    this.id = uuid();
    this.type = 'execute';
    this.accountId = accountId;
    this.requestBytes = requestBytes;
    this.inputNoteIds = inputNoteIds;
    this.delegateTransaction = delegateTransaction;
    this.status = ITransactionStatus.Queued;
    this.initiatedAt = Date.now();
    this.displayIcon = 'DEFAULT';
    this.displayMessage = 'Executing';
  }
}

export class SendTransaction implements ITransaction {
  id: string;
  type: ITransactionType;
  accountId: string;
  amount: bigint;
  secondaryAccountId: string;
  faucetId: string;
  noteType: NoteType;
  transactionId?: string;
  status: ITransactionStatus;
  initiatedAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  displayMessage?: string;
  displayIcon: ITransactionIcon;
  extraInputs: { recallBlocks?: number; delegateTransaction?: boolean } = {
    recallBlocks: undefined,
    delegateTransaction: undefined
  };

  constructor(
    accountId: string,
    amount: bigint,
    recipientId: string,
    faucetId: string,
    noteType: NoteType,
    recallBlocks?: number,
    delegateTransaction?: boolean
  ) {
    this.id = uuid();
    this.type = 'send';
    this.accountId = accountId;
    this.amount = amount;
    this.secondaryAccountId = recipientId;
    this.faucetId = faucetId;
    this.noteType = noteType;
    this.status = ITransactionStatus.Queued;
    this.initiatedAt = Date.now();
    this.displayIcon = 'SEND';
    this.displayMessage = 'Sending';
    this.extraInputs.recallBlocks = recallBlocks;
    this.extraInputs.delegateTransaction = delegateTransaction;
  }
}

export class ConsumeTransaction implements ITransaction {
  id: string;
  type: ITransactionType;
  accountId: string;
  amount?: bigint;
  noteId: string;
  secondaryAccountId?: string;
  faucetId?: string;
  transactionId?: string;
  status: ITransactionStatus;
  initiatedAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  displayMessage?: string;
  displayIcon: ITransactionIcon;
  delegateTransaction?: boolean;

  constructor(accountId: string, noteId: string, delegateTransaction?: boolean) {
    this.id = uuid();
    this.type = 'consume';
    this.accountId = accountId;
    this.noteId = noteId;
    this.status = ITransactionStatus.Queued;
    this.initiatedAt = Date.now();
    this.displayIcon = 'RECEIVE';
    this.displayMessage = 'Consuming';
    this.delegateTransaction = delegateTransaction;
  }
}

export function formatTransactionStatus(status: ITransactionStatus): string {
  const words = ITransactionStatus[status].split(/(?=[A-Z])/);
  return words.join(' ');
}
