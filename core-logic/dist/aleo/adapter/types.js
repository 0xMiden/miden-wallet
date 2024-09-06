export var AleoDAppMessageType;
(function (AleoDAppMessageType) {
    AleoDAppMessageType["GetCurrentPermissionRequest"] = "GET_CURRENT_PERMISSION_REQUEST";
    AleoDAppMessageType["GetCurrentPermissionResponse"] = "GET_CURRENT_PERMISSION_RESPONSE";
    AleoDAppMessageType["PermissionRequest"] = "PERMISSION_REQUEST";
    AleoDAppMessageType["PermissionResponse"] = "PERMISSION_RESPONSE";
    AleoDAppMessageType["DisconnectRequest"] = "DISCONNECT_REQUEST";
    AleoDAppMessageType["DisconnectResponse"] = "DISCONNECT_RESPONSE";
    AleoDAppMessageType["OperationRequest"] = "OPERATION_REQUEST";
    AleoDAppMessageType["OperationResponse"] = "OPERATION_RESPONSE";
    AleoDAppMessageType["SignRequest"] = "SIGN_REQUEST";
    AleoDAppMessageType["SignResponse"] = "SIGN_RESPONSE";
    AleoDAppMessageType["BroadcastRequest"] = "BROADCAST_REQUEST";
    AleoDAppMessageType["BroadcastResponse"] = "BROADCAST_RESPONSE";
    AleoDAppMessageType["DecryptRequest"] = "DECRYPT_REQUEST";
    AleoDAppMessageType["DecryptResponse"] = "DECRYPT_RESPONSE";
    AleoDAppMessageType["RecordsRequest"] = "RECORDS_REQUEST";
    AleoDAppMessageType["RecordsResponse"] = "RECORDS_RESPONSE";
    AleoDAppMessageType["TransactionRequest"] = "TRANSACTION_REQUEST";
    AleoDAppMessageType["TransactionResponse"] = "TRANSACTION_RESPONSE";
    AleoDAppMessageType["ExecutionRequest"] = "EXECUTION_REQUEST";
    AleoDAppMessageType["ExecutionResponse"] = "EXECUTION_RESPONSE";
    AleoDAppMessageType["BulkTransactionsRequest"] = "BULK_TRANSACTIONS_REQUEST";
    AleoDAppMessageType["BulkTransactionsResponse"] = "BULK_TRANSACTIONS_RESPONSE";
    AleoDAppMessageType["DeployRequest"] = "DEPLOY_REQUEST";
    AleoDAppMessageType["DeployResponse"] = "DEPLOY_RESPONSE";
    AleoDAppMessageType["TransactionStatusRequest"] = "TRANSACTION_STATUS_REQUEST";
    AleoDAppMessageType["TransactionStatusResponse"] = "TRANSACTION_STATUS_RESPONSE";
    AleoDAppMessageType["GetExecutionRequest"] = "GET_EXECUTION_REQUEST";
    AleoDAppMessageType["GetExecutionResponse"] = "GET_EXECUTION_RESPONSE";
    AleoDAppMessageType["RecordPlaintextsRequest"] = "RECORD_PLAINTEXTS_REQUEST";
    AleoDAppMessageType["RecordPlaintextsResponse"] = "RECORD_PLAINTEXTS_RESPONSE";
    AleoDAppMessageType["TransactionHistoryRequest"] = "TRANSACTION_HISTORY_REQUEST";
    AleoDAppMessageType["TransactionHistoryResponse"] = "TRANSACTION_HISTORY_RESPONSE";
})(AleoDAppMessageType || (AleoDAppMessageType = {}));
/**
 * Errors
 */
export var AleoDAppErrorType;
(function (AleoDAppErrorType) {
    AleoDAppErrorType["NotGranted"] = "NOT_GRANTED";
    AleoDAppErrorType["NotFound"] = "NOT_FOUND";
    AleoDAppErrorType["InvalidParams"] = "INVALID_PARAMS";
    AleoDAppErrorType["NetworkNotGranted"] = "NETWORK_NOT_GRANTED";
})(AleoDAppErrorType || (AleoDAppErrorType = {}));
export var AleoPageMessageType;
(function (AleoPageMessageType) {
    AleoPageMessageType["Request"] = "ALEO_PAGE_REQUEST";
    AleoPageMessageType["Response"] = "ALEO_PAGE_RESPONSE";
    AleoPageMessageType["ErrorResponse"] = "ALEO_PAGE_ERROR_RESPONSE";
})(AleoPageMessageType || (AleoPageMessageType = {}));
