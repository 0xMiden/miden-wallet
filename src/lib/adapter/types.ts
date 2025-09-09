import {
  AllowedPrivateData,
  MidenTransaction,
  PrivateDataPermission,
  WalletAdapterNetwork,
  MidenSendTransaction,
  MidenConsumeTransaction
} from '@demox-labs/miden-wallet-adapter-base';

export type MidenDAppMessage = MidenDAppRequest | MidenDAppResponse;

export type MidenDAppRequest =
  | MidenDAppGetCurrentPermissionRequest
  | MidenDAppPermissionRequest
  | MidenDAppDisconnectRequest
  | MidenDAppTransactionRequest
  | MidenDAppSendTransactionRequest
  | MidenDAppConsumeRequest
  | MidenDAppPrivateNotesRequest;

export type MidenDAppResponse =
  | MidenDAppGetCurrentPermissionResponse
  | MidenDAppPermissionResponse
  | MidenDAppDisconnectResponse
  | MidenDAppTransactionResponse
  | MidenDAppSendTransactionResponse
  | MidenDAppConsumeResponse
  | MidenDAppPrivateNotesResponse;

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
  TransactionRequest = 'TRANSACTION_REQUEST',
  TransactionResponse = 'TRANSACTION_RESPONSE',
  SendTransactionRequest = 'SEND_TRANSACTION_REQUEST',
  SendTransactionResponse = 'SEND_TRANSACTION_RESPONSE',
  ConsumeRequest = 'CONSUME_REQUEST',
  ConsumeResponse = 'CONSUME_RESPONSE',
  PrivateNotesRequest = 'PRIVATE_NOTES_REQUEST',
  PrivateNotesResponse = 'PRIVATE_NOTES_RESPONSE'
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
  privateDataPermission?: PrivateDataPermission;
  allowedPrivateData?: AllowedPrivateData;
}

export interface MidenDAppPermissionResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.PermissionResponse;
  accountId: string;
  network: string;
  privateDataPermission: PrivateDataPermission;
  allowedPrivateData: AllowedPrivateData;
}

export interface MidenDAppDisconnectRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.DisconnectRequest;
}

export interface MidenDAppDisconnectResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.DisconnectResponse;
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

export interface MidenDAppSendTransactionRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.SendTransactionRequest;
  sourcePublicKey: string;
  transaction: MidenSendTransaction;
}

export interface MidenDAppSendTransactionResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.SendTransactionResponse;
  transactionId?: string;
}

export interface MidenDAppConsumeRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.ConsumeRequest;
  sourcePublicKey: string;
  transaction: MidenConsumeTransaction;
}

export interface MidenDAppConsumeResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.ConsumeResponse;
  transactionId?: string;
}

export interface MidenDAppPrivateNotesRequest extends MidenDAppMessageBase {
  type: MidenDAppMessageType.PrivateNotesRequest;
  sourcePublicKey: string;
}

export interface MidenDAppPrivateNotesResponse extends MidenDAppMessageBase {
  type: MidenDAppMessageType.PrivateNotesResponse;
  privateNotes: any[];
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
  accountId: string;
  privateDataPermission: PrivateDataPermission;
  allowedPrivateData: AllowedPrivateData;
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
