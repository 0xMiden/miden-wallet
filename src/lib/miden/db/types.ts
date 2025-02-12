import { v4 as uuid } from 'uuid';

export enum ITransactionRequestStatus {
  Queued,
  GeneratingTransaction,
  Completed,
  Failed
}

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

export function formatTransactionStatus(status: ITransactionRequestStatus): string {
  const words = ITransactionRequestStatus[status].split(/(?=[A-Z])/);
  return words.join(' ');
}
