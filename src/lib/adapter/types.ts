import {
  MidenTransaction,
  AleoDeployment,
  DecryptPermission,
  WalletAdapterNetwork
} from '@demox-labs/miden-wallet-adapter-base';

export type MidenDAppMessage = MidenDAppRequest | MidenDAppResponse;

export type MidenDAppRequest =
  | MidenDAppGetCurrentPermissionRequest
  | MidenDAppPermissionRequest
  | MidenDAppDisconnectRequest
  | MidenDAppOperationRequest
  | MidenDAppSignRequest
  | MidenDAppBroadcastRequest
  | MidenDAppDecryptRequest
  | MidenDAppRecordsRequest
  | MidenDAppTransactionRequest
  | MidenDAppExecutionRequest
  | MidenDAppBulkTransactionsRequest
  | MidenDAppDeployRequest
  | MidenDAppTransactionStatusRequest
  | MidenDAppGetExecutionRequest
  | MidenDAppRecordPlaintextsRequest
  | MidenDAppTransactionHistoryRequest;

export type MidenDAppResponse =
  | MidenDAppGetCurrentPermissionResponse
  | MidenDAppPermissionResponse
  | MidenDAppDisconnectResponse
  | MidenDAppOperationResponse
  | MidenDAppSignResponse
  | MidenDAppBroadcastResponse
  | MidenDAppDecryptResponse
  | MidenDAppRecordsResponse
  | MidenDAppTransactionResponse
  | MidenDAppExecutionResponse
  | MidenDAppBulkTransactionsResponse
  | MidenDAppDeployResponse
  | MidenDAppTransactionStatusResponse
  | MidenDAppGetExecutionResponse
  | MidenDAppRecordPlaintextsResponse
  | MidenDAppTransactionHistoryResponse;

export interface MidenDAppMessageBase {
  type: MidenDAppMessageType;
}

export enum MidenDAppMessageType {
  GetCurrentPermissionRequest = 'GET_CURRENT_PERMISSION_REQUEST',
  GetCurrentPermissionResponse = 'GET_CURRENT_PERMISSION_RESPONSE',
  PermissionRequest = 'PERMISSION_REQUEST',
  PermissionResponse = 'PERMISSION_RESPONSE',
  DisconnectRequest = 'DISCONNECT_REQUEST',
  DisconnectResponse = 'DISCONNECT_RESPONSE',
  OperationRequest = 'OPERATION_REQUEST',
  OperationResponse = 'OPERATION_RESPONSE',
  SignRequest = 'SIGN_REQUEST',
  SignResponse = 'SIGN_RESPONSE',
  BroadcastRequest = 'BROADCAST_REQUEST',
  BroadcastResponse = 'BROADCAST_RESPONSE',
  DecryptRequest = 'DECRYPT_REQUEST',
  DecryptResponse = 'DECRYPT_RESPONSE',
  RecordsRequest = 'RECORDS_REQUEST',
  RecordsResponse = 'RECORDS_RESPONSE',
  TransactionRequest = 'TRANSACTION_REQUEST',
  TransactionResponse = 'TRANSACTION_RESPONSE',
  ExecutionRequest = 'EXECUTION_REQUEST',
  ExecutionResponse = 'EXECUTION_RESPONSE',
  BulkTransactionsRequest = 'BULK_TRANSACTIONS_REQUEST',
  BulkTransactionsResponse = 'BULK_TRANSACTIONS_RESPONSE',
  DeployRequest = 'DEPLOY_REQUEST',
  DeployResponse = 'DEPLOY_RESPONSE',
  TransactionStatusRequest = 'TRANSACTION_STATUS_REQUEST',
  TransactionStatusResponse = 'TRANSACTION_STATUS_RESPONSE',
  GetExecutionRequest = 'GET_EXECUTION_REQUEST',
  GetExecutionResponse = 'GET_EXECUTION_RESPONSE',
  RecordPlaintextsRequest = 'RECORD_PLAINTEXTS_REQUEST',
  RecordPlaintextsResponse = 'RECORD_PLAINTEXTS_RESPONSE',
  TransactionHistoryRequest = 'TRANSACTION_HISTORY_REQUEST',
  TransactionHistoryResponse = 'TRANSACTION_HISTORY_RESPONSE'
}

/**
 * Messages
 */

export interface MidenDAppGetCurrentPermissionRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.GetCurrentPermissionRequest;
}

export interface MidenDAppGetCurrentPermissionResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.GetCurrentPermissionResponse;
  permission: MidenDAppPermission;
}

export interface MidenDAppPermissionRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.PermissionRequest;
  appMeta: MidenDAppMetadata;
  network: WalletAdapterNetwork;
  force?: boolean;
  decryptPermission?: DecryptPermission;
  programs?: string[];
}

export interface MidenDAppPermissionResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.PermissionResponse;
  publicKey: string;
  network: string;
  decryptPermission: DecryptPermission;
  programs?: string[];
}

export interface MidenDAppDisconnectRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.DisconnectRequest;
}

export interface MidenDAppDisconnectResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.DisconnectResponse;
}

export interface MidenDAppOperationRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.OperationRequest;
  sourcePublicKey: string;
  opParams: any[];
}

export interface MidenDAppOperationResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.OperationResponse;
  opHash: string;
}

export interface MidenDAppSignRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.SignRequest;
  sourcePublicKey: string;
  payload: string;
}

export interface MidenDAppSignResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.SignResponse;
  signature: string;
}

export interface MidenDAppBroadcastRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.BroadcastRequest;
  signedOpBytes: string;
}

export interface MidenDAppBroadcastResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.BroadcastResponse;
  opHash: string;
}

export interface MidenDAppDecryptRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.DecryptRequest;
  sourcePublicKey: string;
  cipherText: string;
  tpk?: string;
  programId?: string;
  functionName?: string;
  index?: number;
}

export interface MidenDAppDecryptResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.DecryptResponse;
  plainText: string;
}

export interface MidenDAppRecordsRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.RecordsRequest;
  sourcePublicKey: string;
  program: string;
}

export interface MidenDAppRecordsResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.RecordsResponse;
  records: any[];
}

export interface MidenDAppTransactionRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.TransactionRequest;
  sourcePublicKey: string;
  transaction: MidenTransaction;
}

export interface MidenDAppTransactionResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.TransactionResponse;
  transactionId?: string;
}

export interface MidenDAppExecutionRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.ExecutionRequest;
  sourcePublicKey: string;
  transaction: MidenTransaction;
}

export interface MidenDAppExecutionResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.ExecutionResponse;
  transactionId?: string;
}

export interface MidenDAppBulkTransactionsRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.BulkTransactionsRequest;
  sourcePublicKey: string;
  transactions: MidenTransaction[];
}

export interface MidenDAppBulkTransactionsResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.BulkTransactionsResponse;
  transactionIds?: string[];
}

export interface MidenDAppDeployRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.DeployRequest;
  sourcePublicKey: string;
  deployment: AleoDeployment;
}

export interface MidenDAppDeployResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.DeployResponse;
  transactionId: string;
}

export interface MidenDAppTransactionStatusRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.TransactionStatusRequest;
  sourcePublicKey: string;
  transactionId: string;
}

export interface MidenDAppTransactionStatusResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.TransactionStatusResponse;
  status: string;
}

export interface MidenDAppGetExecutionRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.GetExecutionRequest;
  sourcePublicKey: string;
  transactionId: string;
}

export interface MidenDAppGetExecutionResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.GetExecutionResponse;
  execution: string;
}

export interface MidenDAppRecordPlaintextsRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.RecordPlaintextsRequest;
  sourcePublicKey: string;
  program: string;
}

export interface MidenDAppRecordPlaintextsResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.RecordPlaintextsResponse;
  records: any[];
}

export interface MidenDAppTransactionHistoryRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.TransactionHistoryRequest;
  sourcePublicKey: string;
  program: string;
}

export interface MidenDAppTransactionHistoryResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.TransactionHistoryResponse;
  transactions: any[];
}

/**
 * Errors
 */
export enum MidenDAppErrorType {
  NotGranted = 'NOT_GRANTED',
  NotFound = 'NOT_FOUND',
  InvalidParams = 'INVALID_PARAMS',
  NetworkNotGranted = 'NETWORK_NOT_GRANTED'
}

/**
 * Misc
 */

export type MidenDAppPermission = {
  rpc?: string;
  publicKey: string;
  decryptPermission: DecryptPermission;
  programs?: string[];
} | null;

export interface MidenDAppMetadata {
  name: string;
}

export interface MidenPageMessage {
  type: MidenPageMessageType;
  payload: any;
  reqId?: string | number;
}

export enum MidenPageMessageType {
  Request = 'MIDEN_PAGE_REQUEST',
  Response = 'MIDEN_PAGE_RESPONSE',
  ErrorResponse = 'MIDEN_PAGE_ERROR_RESPONSE'
}
