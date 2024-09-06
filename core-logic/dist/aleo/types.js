export var AleoChainId;
(function (AleoChainId) {
    AleoChainId["MainnetBeta"] = "mainnetbeta";
    AleoChainId["TestnetBeta"] = "testnetbeta";
    AleoChainId["Canary"] = "canary";
    AleoChainId["Localnet"] = "localnet";
})(AleoChainId || (AleoChainId = {}));
export function isKnownChainId(chainId) {
    return Object.values(AleoChainId).includes(chainId);
}
export var AleoStatus;
(function (AleoStatus) {
    AleoStatus[AleoStatus["Idle"] = 0] = "Idle";
    AleoStatus[AleoStatus["Locked"] = 1] = "Locked";
    AleoStatus[AleoStatus["Ready"] = 2] = "Ready";
})(AleoStatus || (AleoStatus = {}));
export var DerivationType;
(function (DerivationType) {
    DerivationType[DerivationType["ED25519"] = 0] = "ED25519";
    DerivationType[DerivationType["SECP256K1"] = 1] = "SECP256K1";
    DerivationType[DerivationType["P256"] = 2] = "P256";
})(DerivationType || (DerivationType = {}));
export var AleoAccountType;
(function (AleoAccountType) {
    AleoAccountType[AleoAccountType["HD"] = 0] = "HD";
    AleoAccountType[AleoAccountType["Imported"] = 1] = "Imported";
    AleoAccountType[AleoAccountType["Ledger"] = 2] = "Ledger";
    AleoAccountType[AleoAccountType["ManagedKT"] = 3] = "ManagedKT";
    AleoAccountType[AleoAccountType["WatchOnly"] = 4] = "WatchOnly";
})(AleoAccountType || (AleoAccountType = {}));
export var AleoSharedStorageKey;
(function (AleoSharedStorageKey) {
    AleoSharedStorageKey["DAppEnabled"] = "dappenabled";
    AleoSharedStorageKey["LocaleCode"] = "localecode";
    AleoSharedStorageKey["UseLedgerLive"] = "useledgerlive";
    AleoSharedStorageKey["PasswordAttempts"] = "passwordAttempts";
    AleoSharedStorageKey["TimeLock"] = "timelock";
    AleoSharedStorageKey["LockUpEnabled"] = "lock_up";
})(AleoSharedStorageKey || (AleoSharedStorageKey = {}));
/**
 * Messages
 */
export var AleoMessageType;
(function (AleoMessageType) {
    // Aknowledge
    AleoMessageType["Acknowledge"] = "ALEO_CONNECT_AKNOWLEDGE";
    // Notifications
    AleoMessageType["StateUpdated"] = "ALEO_STATE_UPDATED";
    // Generic Responses
    AleoMessageType["LoadingResponse"] = "ALEO_LOADING_RESPONSE";
    // Request-Response pairs
    AleoMessageType["GetStateRequest"] = "ALEO_GET_STATE_REQUEST";
    AleoMessageType["GetStateResponse"] = "ALEO_GET_STATE_RESPONSE";
    AleoMessageType["NewWalletRequest"] = "ALEO_NEW_WALLET_REQUEST";
    AleoMessageType["NewWalletResponse"] = "ALEO_NEW_WALLET_RESPONSE";
    AleoMessageType["UnlockRequest"] = "ALEO_UNLOCK_REQUEST";
    AleoMessageType["UnlockResponse"] = "ALEO_UNLOCK_RESPONSE";
    AleoMessageType["LockRequest"] = "ALEO_LOCK_REQUEST";
    AleoMessageType["LockResponse"] = "ALEO_LOCK_RESPONSE";
    AleoMessageType["CreateAccountRequest"] = "ALEO_CREATE_ACCOUNT_REQUEST";
    AleoMessageType["CreateAccountResponse"] = "ALEO_CREATE_ACCOUNT_RESPONSE";
    AleoMessageType["UpdateCurrentAccountRequest"] = "ALEO_UPDATE_CURRENT_ACCOUNT_REQUEST";
    AleoMessageType["UpdateCurrentAccountResponse"] = "ALEO_UPDATE_CURRENT_ACCOUNT_RESPONSE";
    AleoMessageType["RevealPublicKeyRequest"] = "ALEO_REVEAL_PUBLIC_KEY_REQUEST";
    AleoMessageType["RevealPublicKeyResponse"] = "ALEO_REVEAL_PUBLIC_KEY_RESPONSE";
    AleoMessageType["RevealViewKeyRequest"] = "ALEO_REVEAL_VIEW_KEY_REQUEST";
    AleoMessageType["RevealViewKeyResponse"] = "ALEO_REVEAL_VIEW_KEY_RESPONSE";
    AleoMessageType["RevealPrivateKeyRequest"] = "ALEO_REVEAL_PRIVATE_KEY_REQUEST";
    AleoMessageType["RevealPrivateKeyResponse"] = "ALEO_REVEAL_PRIVATE_KEY_RESPONSE";
    AleoMessageType["RevealMnemonicRequest"] = "ALEO_REVEAL_MNEMONIC_REQUEST";
    AleoMessageType["RevealMnemonicResponse"] = "ALEO_REVEAL_MNEMONIC_RESPONSE";
    AleoMessageType["RemoveAccountRequest"] = "ALEO_REMOVE_ACCOUNT_REQUEST";
    AleoMessageType["RemoveAccountResponse"] = "ALEO_REMOVE_ACCOUNT_RESPONSE";
    AleoMessageType["EditAccountRequest"] = "ALEO_EDIT_ACCOUNT_REQUEST";
    AleoMessageType["EditAccountResponse"] = "ALEO_EDIT_ACCOUNT_RESPONSE";
    AleoMessageType["ImportAccountRequest"] = "ALEO_IMPORT_ACCOUNT_REQUEST";
    AleoMessageType["ImportAccountResponse"] = "ALEO_IMPORT_ACCOUNT_RESPONSE";
    AleoMessageType["ImportWatchOnlyAccountRequest"] = "ALEO_IMPORT_WATCH_ONLY_ACCOUNT_REQUEST";
    AleoMessageType["ImportWatchOnlyAccountResponse"] = "ALEO_IMPORT_WATCH_ONLY_ACCOUNT_RESPONSE";
    AleoMessageType["ImportMnemonicAccountRequest"] = "ALEO_IMPORT_MNEMONIC_ACCOUNT_REQUEST";
    AleoMessageType["ImportMnemonicAccountResponse"] = "ALEO_IMPORT_MNEMONIC_ACCOUNT_RESPONSE";
    AleoMessageType["UpdateSettingsRequest"] = "ALEO_UPDATE_SETTINGS_REQUEST";
    AleoMessageType["UpdateSettingsResponse"] = "ALEO_UPDATE_SETTINGS_RESPONSE";
    AleoMessageType["AuthorizeRequest"] = "ALEO_AUTHORIZE_REQUEST";
    AleoMessageType["AuthorizeResponse"] = "ALEO_AUTHORIZE_RESPONSE";
    AleoMessageType["AuthorizeDeployRequest"] = "ALEO_AUTHORIZE_DEPLOY_REQUEST";
    AleoMessageType["AuthorizeDeployResponse"] = "ALEO_AUTHORIZE_DEPLOY_RESPONSE";
    AleoMessageType["ConfirmationRequest"] = "ALEO_CONFIRMATION_REQUEST";
    AleoMessageType["ConfirmationResponse"] = "ALEO_CONFIRMATION_RESPONSE";
    AleoMessageType["PageRequest"] = "ALEO_PAGE_REQUEST";
    AleoMessageType["PageResponse"] = "ALEO_PAGE_RESPONSE";
    AleoMessageType["DAppGetPayloadRequest"] = "ALEO_DAPP_GET_PAYLOAD_REQUEST";
    AleoMessageType["DAppGetPayloadResponse"] = "ALEO_DAPP_GET_PAYLOAD_RESPONSE";
    AleoMessageType["DAppPermConfirmationRequest"] = "ALEO_DAPP_PERM_CONFIRMATION_REQUEST";
    AleoMessageType["DAppPermConfirmationResponse"] = "ALEO_DAPP_PERM_CONFIRMATION_RESPONSE";
    AleoMessageType["DAppSignConfirmationRequest"] = "ALEO_DAPP_SIGN_CONFIRMATION_REQUEST";
    AleoMessageType["DAppSignConfirmationResponse"] = "ALEO_DAPP_SIGN_CONFIRMATION_RESPONSE";
    AleoMessageType["DAppDecryptConfirmationRequest"] = "ALEO_DAPP_DECRYPT_CONFIRMATION_REQUEST";
    AleoMessageType["DAppDecryptConfirmationResponse"] = "ALEO_DAPP_DECRYPT_CONFIRMATION_RESPONSE";
    AleoMessageType["DAppRecordsConfirmationRequest"] = "ALEO_DAPP_RECORDS_CONFIRMATION_REQUEST";
    AleoMessageType["DAppRecordsConfirmationResponse"] = "ALEO_DAPP_RECORDS_CONFIRMATION_RESPONSE";
    AleoMessageType["DAppTransactionConfirmationRequest"] = "ALEO_DAPP_TRANSACTION_CONFIRMATION_REQUEST";
    AleoMessageType["DAppTransactionConfirmationResponse"] = "ALEO_DAPP_TRANSACTION_CONFIRMATION_RESPONSE";
    AleoMessageType["DAppBulkTransactionsConfirmationRequest"] = "ALEO_DAPP_BULK_TRANSACTIONS_CONFIRMATION_REQUEST";
    AleoMessageType["DAppBulkTransactionsConfirmationResponse"] = "ALEO_DAPP_BULK_TRANSACTIONS_CONFIRMATION_RESPONSE";
    AleoMessageType["DAppDeployConfirmationRequest"] = "ALEO_DAPP_DEPLOY_CONFIRMATION_REQUEST";
    AleoMessageType["DAppDeployConfirmationResponse"] = "ALEO_DAPP_DEPLOY_CONFIRMATION_RESPONSE";
    AleoMessageType["DAppGetAllSessionsRequest"] = "ALEO_DAPP_GET_ALL_SESSIONS_REQUEST";
    AleoMessageType["DAppGetAllSessionsResponse"] = "ALEO_DAPP_GET_ALL_SESSIONS_RESPONSE";
    AleoMessageType["DAppRemoveSessionRequest"] = "ALEO_DAPP_REMOVE_SESSION_REQUEST";
    AleoMessageType["DAppRemoveSessionResponse"] = "ALEO_DAPP_REMOVE_SESSION_RESPONSE";
    AleoMessageType["SendTrackEventRequest"] = "SEND_TRACK_EVENT_REQUEST";
    AleoMessageType["SendTrackEventResponse"] = "SEND_TRACK_EVENT_RESPONSE";
    AleoMessageType["SendPageEventRequest"] = "SEND_PAGE_EVENT_REQUEST";
    AleoMessageType["SendPageEventResponse"] = "SEND_PAGE_EVENT_RESPONSE";
    AleoMessageType["SendPerformanceEventRequest"] = "SEND_PROOF_GENERATION_EVENT_REQUEST";
    AleoMessageType["SendPerformanceEventResponse"] = "SEND_PROOF_GENERATION_EVENT_RESPONSE";
    AleoMessageType["DecryptCiphertextsRequest"] = "DECRYPT_CIPHERTEXTS_REQUEST";
    AleoMessageType["DecryptCiphertextsResponse"] = "DECRYPT_CIPHERTEXTS_RESPONSE";
    AleoMessageType["GetOwnedRecordsRequest"] = "GET_OWNED_RECORDS_REQUEST";
    AleoMessageType["GetOwnedRecordsResponse"] = "GET_OWNED_RECORDS_RESPONSE";
})(AleoMessageType || (AleoMessageType = {}));
export var ImportAccountFormType;
(function (ImportAccountFormType) {
    ImportAccountFormType["PrivateKey"] = "ImportAccountFormType.PrivateKey";
    ImportAccountFormType["Mnemonic"] = "ImportAccountFormType.Mnemonic";
    ImportAccountFormType["WatchOnly"] = "WatchOnly";
})(ImportAccountFormType || (ImportAccountFormType = {}));
