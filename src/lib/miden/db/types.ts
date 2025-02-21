import { v4 as uuid } from 'uuid';

export enum ITransactionStatus {
  Queued,
  GeneratingTransaction,
  Completed,
  Failed
}

export type ITransactionIcon = 'SEND' | 'RECEIVE' | 'SWAP' | 'FAILED' | 'MINT' | 'DEFAULT';
export type ITransactionType = 'send' | 'consume' | 'execute';
export type INoteType = 'public' | 'private';

export interface ITransaction {
  id: string;
  type: ITransactionType;
  accountId: string;
  amount?: bigint;
  secondaryAccountId?: string;
  faucetId?: string;
  noteId?: string;
  noteType?: INoteType;
  transactionId?: string;
  requestBytes?: Uint8Array;
  status: ITransactionStatus;
  initiatedAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  displayMessage?: string;
  displayIcon: ITransactionIcon;
}

export class Transaction implements ITransaction {
  id: string;
  type: ITransactionType;
  accountId: string;
  amount?: bigint;
  noteType?: INoteType;
  transactionId?: string;
  requestBytes?: Uint8Array;
  status: ITransactionStatus;
  initiatedAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  displayMessage?: string;
  displayIcon: ITransactionIcon;

  constructor(type: ITransactionType, accountId: string, requestBytes?: Uint8Array, amount?: bigint) {
    this.id = uuid();
    this.type = type;
    this.accountId = accountId;
    this.requestBytes = requestBytes;
    this.amount = amount;
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
  noteType: INoteType;
  transactionId?: string;
  status: ITransactionStatus;
  initiatedAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  displayMessage?: string;
  displayIcon: ITransactionIcon;

  constructor(
    accountId: string,
    amount: bigint,
    recipientId: string,
    faucetId: string,
    noteType: INoteType,
    status: ITransactionStatus = ITransactionStatus.GeneratingTransaction
  ) {
    this.id = uuid();
    this.type = 'send';
    this.accountId = accountId;
    this.amount = amount;
    this.secondaryAccountId = recipientId;
    this.faucetId = faucetId;
    this.noteType = noteType;
    this.status = status;
    this.initiatedAt = Date.now();
    this.displayIcon = 'SEND';
    this.displayMessage = 'Sending';
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

  constructor(accountId: string, noteId: string, amount?: bigint, faucetId?: string, senderId?: string) {
    this.id = uuid();
    this.type = 'consume';
    this.accountId = accountId;
    this.amount = amount;
    this.noteId = noteId;
    this.faucetId = faucetId;
    this.secondaryAccountId = senderId;
    this.status = ITransactionStatus.GeneratingTransaction;
    this.initiatedAt = Date.now();
    this.displayIcon = 'RECEIVE';
    this.displayMessage = 'Consuming';
  }
}

export enum ITransactionRequestStatus {
  Queued,
  GeneratingTransaction,
  Completed,
  Failed
}

export function formatTransactionStatus(status: ITransactionStatus): string {
  const words = ITransactionStatus[status].split(/(?=[A-Z])/);
  return words.join(' ');
}

// DEPRECATED

export type ITransactionRequestIcon = 'SEND' | 'RECEIVE' | 'SWAP' | 'REJECTED' | 'MINT' | 'DEFAULT';

export interface ITransactionRequest {
  id: string;
  accountId: string;
  requestBytes: Uint8Array;
  status: ITransactionRequestStatus;
  initiatedAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  displayMessage?: string;
  displayIcon: ITransactionRequestIcon;
}

export class TransactionRequest implements ITransactionRequest {
  id: string;
  accountId: string;
  requestBytes: Uint8Array;
  status: ITransactionRequestStatus;
  initiatedAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  displayMessage?: string;
  displayIcon: ITransactionRequestIcon;

  constructor(accountId: string, requestBytes: Uint8Array) {
    this.id = uuid();
    this.accountId = accountId;
    this.requestBytes = requestBytes;
    console.log('TransactionRequest', this.requestBytes);
    this.status = ITransactionRequestStatus.Queued;
    this.initiatedAt = Date.now();
    this.displayIcon = 'DEFAULT';
  }
}
