import { AleoTransaction, AleoDeployment, DecryptPermission, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
export type AleoDAppMessage = AleoDAppRequest | AleoDAppResponse;
export type AleoDAppRequest = AleoDAppGetCurrentPermissionRequest | AleoDAppPermissionRequest | AleoDAppDisconnectRequest | AleoDAppOperationRequest | AleoDAppSignRequest | AleoDAppBroadcastRequest | AleoDAppDecryptRequest | AleoDAppRecordsRequest | AleoDAppTransactionRequest | AleoDAppExecutionRequest | AleoDAppBulkTransactionsRequest | AleoDAppDeployRequest | AleoDAppTransactionStatusRequest | AleoDAppGetExecutionRequest | AleoDAppRecordPlaintextsRequest | AleoDAppTransactionHistoryRequest;
export type AleoDAppResponse = AleoDAppGetCurrentPermissionResponse | AleoDAppPermissionResponse | AleoDAppDisconnectResponse | AleoDAppOperationResponse | AleoDAppSignResponse | AleoDAppBroadcastResponse | AleoDAppDecryptResponse | AleoDAppRecordsResponse | AleoDAppTransactionResponse | AleoDAppExecutionResponse | AleoDAppBulkTransactionsResponse | AleoDAppDeployResponse | AleoDAppTransactionStatusResponse | AleoDAppGetExecutionResponse | AleoDAppRecordPlaintextsResponse | AleoDAppTransactionHistoryResponse;
export interface AleoDAppMessageBase {
    type: AleoDAppMessageType;
}
export declare enum AleoDAppMessageType {
    GetCurrentPermissionRequest = "GET_CURRENT_PERMISSION_REQUEST",
    GetCurrentPermissionResponse = "GET_CURRENT_PERMISSION_RESPONSE",
    PermissionRequest = "PERMISSION_REQUEST",
    PermissionResponse = "PERMISSION_RESPONSE",
    DisconnectRequest = "DISCONNECT_REQUEST",
    DisconnectResponse = "DISCONNECT_RESPONSE",
    OperationRequest = "OPERATION_REQUEST",
    OperationResponse = "OPERATION_RESPONSE",
    SignRequest = "SIGN_REQUEST",
    SignResponse = "SIGN_RESPONSE",
    BroadcastRequest = "BROADCAST_REQUEST",
    BroadcastResponse = "BROADCAST_RESPONSE",
    DecryptRequest = "DECRYPT_REQUEST",
    DecryptResponse = "DECRYPT_RESPONSE",
    RecordsRequest = "RECORDS_REQUEST",
    RecordsResponse = "RECORDS_RESPONSE",
    TransactionRequest = "TRANSACTION_REQUEST",
    TransactionResponse = "TRANSACTION_RESPONSE",
    ExecutionRequest = "EXECUTION_REQUEST",
    ExecutionResponse = "EXECUTION_RESPONSE",
    BulkTransactionsRequest = "BULK_TRANSACTIONS_REQUEST",
    BulkTransactionsResponse = "BULK_TRANSACTIONS_RESPONSE",
    DeployRequest = "DEPLOY_REQUEST",
    DeployResponse = "DEPLOY_RESPONSE",
    TransactionStatusRequest = "TRANSACTION_STATUS_REQUEST",
    TransactionStatusResponse = "TRANSACTION_STATUS_RESPONSE",
    GetExecutionRequest = "GET_EXECUTION_REQUEST",
    GetExecutionResponse = "GET_EXECUTION_RESPONSE",
    RecordPlaintextsRequest = "RECORD_PLAINTEXTS_REQUEST",
    RecordPlaintextsResponse = "RECORD_PLAINTEXTS_RESPONSE",
    TransactionHistoryRequest = "TRANSACTION_HISTORY_REQUEST",
    TransactionHistoryResponse = "TRANSACTION_HISTORY_RESPONSE"
}
/**
 * Messages
 */
export interface AleoDAppGetCurrentPermissionRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.GetCurrentPermissionRequest;
}
export interface AleoDAppGetCurrentPermissionResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.GetCurrentPermissionResponse;
    permission: AleoDAppPermission;
}
export interface AleoDAppPermissionRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.PermissionRequest;
    appMeta: AleoDAppMetadata;
    network: WalletAdapterNetwork;
    force?: boolean;
    decryptPermission?: DecryptPermission;
    programs?: string[];
}
export interface AleoDAppPermissionResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.PermissionResponse;
    publicKey: string;
    network: string;
    decryptPermission: DecryptPermission;
    programs?: string[];
}
export interface AleoDAppDisconnectRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.DisconnectRequest;
}
export interface AleoDAppDisconnectResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.DisconnectResponse;
}
export interface AleoDAppOperationRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.OperationRequest;
    sourcePublicKey: string;
    opParams: any[];
}
export interface AleoDAppOperationResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.OperationResponse;
    opHash: string;
}
export interface AleoDAppSignRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.SignRequest;
    sourcePublicKey: string;
    payload: string;
}
export interface AleoDAppSignResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.SignResponse;
    signature: string;
}
export interface AleoDAppBroadcastRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.BroadcastRequest;
    signedOpBytes: string;
}
export interface AleoDAppBroadcastResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.BroadcastResponse;
    opHash: string;
}
export interface AleoDAppDecryptRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.DecryptRequest;
    sourcePublicKey: string;
    cipherText: string;
    tpk?: string;
    programId?: string;
    functionName?: string;
    index?: number;
}
export interface AleoDAppDecryptResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.DecryptResponse;
    plainText: string;
}
export interface AleoDAppRecordsRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.RecordsRequest;
    sourcePublicKey: string;
    program: string;
}
export interface AleoDAppRecordsResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.RecordsResponse;
    records: any[];
}
export interface AleoDAppTransactionRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.TransactionRequest;
    sourcePublicKey: string;
    transaction: AleoTransaction;
}
export interface AleoDAppTransactionResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.TransactionResponse;
    transactionId?: string;
}
export interface AleoDAppExecutionRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.ExecutionRequest;
    sourcePublicKey: string;
    transaction: AleoTransaction;
}
export interface AleoDAppExecutionResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.ExecutionResponse;
    transactionId?: string;
}
export interface AleoDAppBulkTransactionsRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.BulkTransactionsRequest;
    sourcePublicKey: string;
    transactions: AleoTransaction[];
}
export interface AleoDAppBulkTransactionsResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.BulkTransactionsResponse;
    transactionIds?: string[];
}
export interface AleoDAppDeployRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.DeployRequest;
    sourcePublicKey: string;
    deployment: AleoDeployment;
}
export interface AleoDAppDeployResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.DeployResponse;
    transactionId: string;
}
export interface AleoDAppTransactionStatusRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.TransactionStatusRequest;
    sourcePublicKey: string;
    transactionId: string;
}
export interface AleoDAppTransactionStatusResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.TransactionStatusResponse;
    status: string;
}
export interface AleoDAppGetExecutionRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.GetExecutionRequest;
    sourcePublicKey: string;
    transactionId: string;
}
export interface AleoDAppGetExecutionResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.GetExecutionResponse;
    execution: string;
}
export interface AleoDAppRecordPlaintextsRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.RecordPlaintextsRequest;
    sourcePublicKey: string;
    program: string;
}
export interface AleoDAppRecordPlaintextsResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.RecordPlaintextsResponse;
    records: any[];
}
export interface AleoDAppTransactionHistoryRequest extends AleoDAppMessageBase {
    type: AleoDAppMessageType.TransactionHistoryRequest;
    sourcePublicKey: string;
    program: string;
}
export interface AleoDAppTransactionHistoryResponse extends AleoDAppMessageBase {
    type: AleoDAppMessageType.TransactionHistoryResponse;
    transactions: any[];
}
/**
 * Errors
 */
export declare enum AleoDAppErrorType {
    NotGranted = "NOT_GRANTED",
    NotFound = "NOT_FOUND",
    InvalidParams = "INVALID_PARAMS",
    NetworkNotGranted = "NETWORK_NOT_GRANTED"
}
/**
 * Misc
 */
export type AleoDAppPermission = {
    rpc?: string;
    publicKey: string;
    decryptPermission: DecryptPermission;
    programs?: string[];
} | null;
export interface AleoDAppMetadata {
    name: string;
}
export interface AleoPageMessage {
    type: AleoPageMessageType;
    payload: any;
    reqId?: string | number;
}
export declare enum AleoPageMessageType {
    Request = "ALEO_PAGE_REQUEST",
    Response = "ALEO_PAGE_RESPONSE",
    ErrorResponse = "ALEO_PAGE_ERROR_RESPONSE"
}
//# sourceMappingURL=types.d.ts.map