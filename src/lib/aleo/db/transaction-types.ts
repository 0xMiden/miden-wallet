import { v4 as uuid } from 'uuid';

export enum ITransitionStatus {
  Queued,
  Generating,
  Completed,
  Failed
}

export interface ITransition {
  id: string;
  transitionId?: string;
  transactionDbId: string;
  index: number;
  inputRecordIds: string[];
  outputRecordIds: string[];
  address: string;
  chainId: string;
  program: string;
  functionName: string;
  status: ITransitionStatus;
  inputsJson: string;
  outputsJson?: string;
  initiatedAt: number;
  completedAt?: number;
  json?: string;
  isFee: number;
}

export class Transition implements ITransition {
  id: string;
  transitionId?: string;
  transactionDbId: string;
  index: number;
  inputRecordIds: string[];
  outputRecordIds: string[];
  address: string;
  chainId: string;
  program: string;
  functionName: string;
  status: ITransitionStatus;
  inputsJson: string;
  outputsJson?: string;
  initiatedAt: number;
  completedAt?: number;
  json?: string;
  isFee: number;

  constructor(
    address: string,
    chainId: string,
    program: string,
    functionName: string,
    inputsJson: string,
    transactionDbId: string,
    index: number,
    isFee: number
  ) {
    this.id = uuid();
    this.transactionDbId = transactionDbId;
    this.index = index;
    this.inputRecordIds = [];
    this.outputRecordIds = [];
    this.address = address;
    this.chainId = chainId;
    this.program = program;
    this.functionName = functionName;
    this.status = ITransitionStatus.Queued;
    this.inputsJson = inputsJson;
    this.initiatedAt = Date.now();
    this.isFee = isFee;
  }
}

export enum ITransactionStatus {
  Queued,
  DownloadingProverFiles,
  GeneratingTransaction,
  GeneratingDeployment,
  Broadcasting,
  Completed,
  Failed,
  Finalized,
  Rejected
}

export const TransactionProcessingStates = [
  ITransactionStatus.DownloadingProverFiles,
  ITransactionStatus.GeneratingTransaction,
  ITransactionStatus.GeneratingDeployment,
  ITransactionStatus.Broadcasting
];

export type ITransactionIcon =
  | 'SEND'
  | 'RECEIVE'
  | 'DEPLOY'
  | 'REJECTED'
  | 'MINT'
  | 'CONVERT_PRIVATE'
  | 'CONVERT_PUBLIC'
  | 'CONVERT_PRIVATE_TOKEN'
  | 'CONVERT_PUBLIC_TOKEN'
  | 'STAKE'
  | 'DEFAULT';
export type ITransactionType = 'execute' | 'deploy' | 'fee';

export interface ITransaction {
  id: string;
  type: ITransactionType;
  transactionId?: string;
  address: string;
  chainId: string;
  status: ITransactionStatus;
  transitionIds: string[];
  initiatedAt: number;
  onlyExecute: number;
  processingStartedAt?: number;
  completedAt?: number;
  finalizedAt?: number;
  blockHeight?: bigint;
  imports: { [key: string]: string };
  fee: bigint;
  feeId?: string;
  json?: string;
  displayMessage?: string;
  displayIcon: ITransactionIcon;
  deployedProgramId?: string;
  deployedProgram?: string;
  deployedEdition?: number;
  authorization?: string;
  feeAuthorization?: string;
  delegated?: number;
  requestId?: string;
}

export class Transaction implements ITransaction {
  id: string;
  type: ITransactionType;
  transactionId?: string;
  address: string;
  chainId: string;
  status: ITransactionStatus;
  transitionIds: string[];
  initiatedAt: number;
  onlyExecute: number;
  completedAt?: number;
  finalizedAt?: number;
  blockHeight?: bigint;
  imports: { [key: string]: string };
  fee: bigint;
  feeId?: string;
  json?: string;
  displayMessage?: string;
  displayIcon: ITransactionIcon;
  deployedProgramId?: string;
  deployedProgram?: string;
  deployedEdition?: number;
  authorization?: string;
  feeAuthorization?: string;
  delegated?: number;
  requestId?: string;

  constructor(type: ITransactionType, address: string, chainId: string, fee?: bigint, feeId?: string) {
    this.id = uuid();
    this.type = type;
    this.address = address;
    this.chainId = chainId;
    this.status = ITransactionStatus.Queued;
    this.transitionIds = [];
    this.initiatedAt = Date.now();
    this.fee = fee || BigInt(0);
    this.feeId = feeId;
    this.displayIcon = 'DEFAULT';
    this.imports = {};
    this.onlyExecute = 0;
  }
}

export function formatTransactionStatus(status: ITransactionStatus): string {
  const words = ITransactionStatus[status].split(/(?=[A-Z])/);
  return words.join(' ');
}
