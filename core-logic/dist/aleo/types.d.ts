import { DecryptPermission, WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import { AleoDAppMetadata } from './adapter/types';
import { AleoSendPageEventRequest, AleoSendPageEventResponse, AleoSendPerformanceEventRequest, AleoSendPerformanceEventResponse, AleoSendTrackEventRequest, AleoSendTrackEventResponse } from './analytics-types';
type NonEmptyArray<T> = [T, ...T[]];
export interface ReadyAleoState extends AleoState {
    status: AleoStatus.Ready;
    accounts: NonEmptyArray<AleoAccount>;
    networks: NonEmptyArray<AleoNetwork>;
    settings: AleoSettings;
    currentAccount: AleoAccount;
}
export interface AleoDAppSession {
    network: WalletAdapterNetwork;
    appMeta: AleoDAppMetadata;
    publicKey: string;
    decryptPermission: DecryptPermission;
    programs?: string[];
}
export interface AleoState {
    status: AleoStatus;
    accounts: AleoAccount[];
    networks: AleoNetwork[];
    settings: AleoSettings | null;
    currentAccount: AleoAccount | null;
    ownMnemonic: boolean | null;
}
export declare enum AleoChainId {
    MainnetBeta = "mainnetbeta",
    TestnetBeta = "testnetbeta",
    Canary = "canary",
    Localnet = "localnet"
}
export declare function isKnownChainId(chainId: string): chainId is AleoChainId;
export declare enum AleoStatus {
    Idle = 0,
    Locked = 1,
    Ready = 2
}
export type AleoAccount = AleoHDAccount | AleoImportedAccount | AleoLedgerAccount | AleoManagedKTAccount | AleoWatchOnlyAccount;
export declare enum DerivationType {
    ED25519 = 0,
    SECP256K1 = 1,
    P256 = 2
}
export interface AleoLedgerAccount extends AleoAccountBase {
    type: AleoAccountType.Ledger;
    derivationPath: string;
}
export interface AleoImportedAccount extends AleoAccountBase {
    type: AleoAccountType.Imported;
}
export interface AleoHDAccount extends AleoAccountBase {
    type: AleoAccountType.HD;
    hdIndex: number;
}
export interface AleoManagedKTAccount extends AleoAccountBase {
    type: AleoAccountType.ManagedKT;
    chainId: string;
    owner: string;
}
export interface AleoWatchOnlyAccount extends AleoAccountBase {
    type: AleoAccountType.WatchOnly;
    chainId?: string;
}
export interface AleoAccountBase {
    type: AleoAccountType;
    name: string;
    publicKey: string;
    viewKey: string;
    privateKey?: string;
    hdIndex?: number;
    derivationPath?: string;
    derivationType?: DerivationType;
}
export declare enum AleoAccountType {
    HD = 0,
    Imported = 1,
    Ledger = 2,
    ManagedKT = 3,
    WatchOnly = 4
}
export interface AleoNetwork {
    id: string;
    name: string;
    nameI18nKey?: string;
    description: string;
    descriptionI18nKey?: string;
    type: AleoNetworkType;
    rpcBaseURL: string;
    color: string;
    disabled: boolean;
    autoSync: boolean;
    hidden?: boolean;
    hasFaucet: boolean;
    ansURL?: string;
    sdkVersion?: string;
}
export type AleoNetworkType = 'main' | 'test' | 'dcp';
export interface AleoSettings {
    customNetworks?: AleoNetwork[];
    contacts?: AleoContact[];
}
export declare enum AleoSharedStorageKey {
    DAppEnabled = "dappenabled",
    LocaleCode = "localecode",
    UseLedgerLive = "useledgerlive",
    PasswordAttempts = "passwordAttempts",
    TimeLock = "timelock",
    LockUpEnabled = "lock_up"
}
export type AleoDAppSessions = Record<string, AleoDAppSession[]>;
export interface AleoContact {
    address: string;
    name: string;
    addedAt?: number;
    accountInWallet?: boolean;
}
/**
 * Internal confirmation payloads
 */
export interface AleoConfirmationPayloadBase {
    type: string;
    sourcePkh: string;
}
export interface AleoSignConfirmationPayload extends AleoConfirmationPayloadBase {
    type: 'sign';
    bytes: string;
    watermark?: string;
}
export type AleoConfirmationPayload = AleoSignConfirmationPayload;
/**
 * DApp confirmation payloads
 */
export type DappMetadata = AleoDAppMetadata & {
    icon?: string;
};
export interface AleoDAppPayloadBase {
    type: string;
    origin: string;
    networkRpc: string;
    appMeta: DappMetadata;
    error?: any;
}
export interface AleoDAppConnectPayload extends AleoDAppPayloadBase {
    type: 'connect';
    decryptPermission: DecryptPermission;
    existingPermission: boolean;
    programs?: string[];
}
export interface AleoDAppSignPayload extends AleoDAppPayloadBase {
    type: 'sign';
    sourcePublicKey: string;
    payload: string;
    preview: any;
}
export interface AleoDAppDecryptPayload extends AleoDAppPayloadBase {
    type: 'decrypt';
    sourcePublicKey: string;
    cipherText: string;
    tpk?: string;
    programId?: string;
    functionName?: string;
    index?: number;
    preview: any;
}
export interface AleoDAppRecordsPayload extends AleoDAppPayloadBase {
    type: 'records';
    sourcePublicKey: string;
    program: string;
    records: any[];
    preview: any;
}
export interface AleoDAppTransactionPayload extends AleoDAppPayloadBase {
    type: 'transaction';
    sourcePublicKey: string;
    preview: any;
    transactionMessages: string[];
    fee: number;
}
export interface AleoDAppBulkTransactionsPayload extends AleoDAppPayloadBase {
    type: 'bulk-transactions';
    sourcePublicKey: string;
    preview: any;
    transactionMessages: string[];
    fee: number;
}
export interface AleoDAppDeployPayload extends AleoDAppPayloadBase {
    type: 'deploy';
    sourcePublicKey: string;
    preview: any;
    programId: string;
    program: string;
    fee: number;
}
export type AleoDAppPayload = AleoDAppConnectPayload | AleoDAppSignPayload | AleoDAppDecryptPayload | AleoDAppRecordsPayload | AleoDAppTransactionPayload | AleoDAppBulkTransactionsPayload | AleoDAppDeployPayload;
/**
 * Messages
 */
export declare enum AleoMessageType {
    Acknowledge = "ALEO_CONNECT_AKNOWLEDGE",
    StateUpdated = "ALEO_STATE_UPDATED",
    LoadingResponse = "ALEO_LOADING_RESPONSE",
    GetStateRequest = "ALEO_GET_STATE_REQUEST",
    GetStateResponse = "ALEO_GET_STATE_RESPONSE",
    NewWalletRequest = "ALEO_NEW_WALLET_REQUEST",
    NewWalletResponse = "ALEO_NEW_WALLET_RESPONSE",
    UnlockRequest = "ALEO_UNLOCK_REQUEST",
    UnlockResponse = "ALEO_UNLOCK_RESPONSE",
    LockRequest = "ALEO_LOCK_REQUEST",
    LockResponse = "ALEO_LOCK_RESPONSE",
    CreateAccountRequest = "ALEO_CREATE_ACCOUNT_REQUEST",
    CreateAccountResponse = "ALEO_CREATE_ACCOUNT_RESPONSE",
    UpdateCurrentAccountRequest = "ALEO_UPDATE_CURRENT_ACCOUNT_REQUEST",
    UpdateCurrentAccountResponse = "ALEO_UPDATE_CURRENT_ACCOUNT_RESPONSE",
    RevealPublicKeyRequest = "ALEO_REVEAL_PUBLIC_KEY_REQUEST",
    RevealPublicKeyResponse = "ALEO_REVEAL_PUBLIC_KEY_RESPONSE",
    RevealViewKeyRequest = "ALEO_REVEAL_VIEW_KEY_REQUEST",
    RevealViewKeyResponse = "ALEO_REVEAL_VIEW_KEY_RESPONSE",
    RevealPrivateKeyRequest = "ALEO_REVEAL_PRIVATE_KEY_REQUEST",
    RevealPrivateKeyResponse = "ALEO_REVEAL_PRIVATE_KEY_RESPONSE",
    RevealMnemonicRequest = "ALEO_REVEAL_MNEMONIC_REQUEST",
    RevealMnemonicResponse = "ALEO_REVEAL_MNEMONIC_RESPONSE",
    RemoveAccountRequest = "ALEO_REMOVE_ACCOUNT_REQUEST",
    RemoveAccountResponse = "ALEO_REMOVE_ACCOUNT_RESPONSE",
    EditAccountRequest = "ALEO_EDIT_ACCOUNT_REQUEST",
    EditAccountResponse = "ALEO_EDIT_ACCOUNT_RESPONSE",
    ImportAccountRequest = "ALEO_IMPORT_ACCOUNT_REQUEST",
    ImportAccountResponse = "ALEO_IMPORT_ACCOUNT_RESPONSE",
    ImportWatchOnlyAccountRequest = "ALEO_IMPORT_WATCH_ONLY_ACCOUNT_REQUEST",
    ImportWatchOnlyAccountResponse = "ALEO_IMPORT_WATCH_ONLY_ACCOUNT_RESPONSE",
    ImportMnemonicAccountRequest = "ALEO_IMPORT_MNEMONIC_ACCOUNT_REQUEST",
    ImportMnemonicAccountResponse = "ALEO_IMPORT_MNEMONIC_ACCOUNT_RESPONSE",
    UpdateSettingsRequest = "ALEO_UPDATE_SETTINGS_REQUEST",
    UpdateSettingsResponse = "ALEO_UPDATE_SETTINGS_RESPONSE",
    AuthorizeRequest = "ALEO_AUTHORIZE_REQUEST",
    AuthorizeResponse = "ALEO_AUTHORIZE_RESPONSE",
    AuthorizeDeployRequest = "ALEO_AUTHORIZE_DEPLOY_REQUEST",
    AuthorizeDeployResponse = "ALEO_AUTHORIZE_DEPLOY_RESPONSE",
    ConfirmationRequest = "ALEO_CONFIRMATION_REQUEST",
    ConfirmationResponse = "ALEO_CONFIRMATION_RESPONSE",
    PageRequest = "ALEO_PAGE_REQUEST",
    PageResponse = "ALEO_PAGE_RESPONSE",
    DAppGetPayloadRequest = "ALEO_DAPP_GET_PAYLOAD_REQUEST",
    DAppGetPayloadResponse = "ALEO_DAPP_GET_PAYLOAD_RESPONSE",
    DAppPermConfirmationRequest = "ALEO_DAPP_PERM_CONFIRMATION_REQUEST",
    DAppPermConfirmationResponse = "ALEO_DAPP_PERM_CONFIRMATION_RESPONSE",
    DAppSignConfirmationRequest = "ALEO_DAPP_SIGN_CONFIRMATION_REQUEST",
    DAppSignConfirmationResponse = "ALEO_DAPP_SIGN_CONFIRMATION_RESPONSE",
    DAppDecryptConfirmationRequest = "ALEO_DAPP_DECRYPT_CONFIRMATION_REQUEST",
    DAppDecryptConfirmationResponse = "ALEO_DAPP_DECRYPT_CONFIRMATION_RESPONSE",
    DAppRecordsConfirmationRequest = "ALEO_DAPP_RECORDS_CONFIRMATION_REQUEST",
    DAppRecordsConfirmationResponse = "ALEO_DAPP_RECORDS_CONFIRMATION_RESPONSE",
    DAppTransactionConfirmationRequest = "ALEO_DAPP_TRANSACTION_CONFIRMATION_REQUEST",
    DAppTransactionConfirmationResponse = "ALEO_DAPP_TRANSACTION_CONFIRMATION_RESPONSE",
    DAppBulkTransactionsConfirmationRequest = "ALEO_DAPP_BULK_TRANSACTIONS_CONFIRMATION_REQUEST",
    DAppBulkTransactionsConfirmationResponse = "ALEO_DAPP_BULK_TRANSACTIONS_CONFIRMATION_RESPONSE",
    DAppDeployConfirmationRequest = "ALEO_DAPP_DEPLOY_CONFIRMATION_REQUEST",
    DAppDeployConfirmationResponse = "ALEO_DAPP_DEPLOY_CONFIRMATION_RESPONSE",
    DAppGetAllSessionsRequest = "ALEO_DAPP_GET_ALL_SESSIONS_REQUEST",
    DAppGetAllSessionsResponse = "ALEO_DAPP_GET_ALL_SESSIONS_RESPONSE",
    DAppRemoveSessionRequest = "ALEO_DAPP_REMOVE_SESSION_REQUEST",
    DAppRemoveSessionResponse = "ALEO_DAPP_REMOVE_SESSION_RESPONSE",
    SendTrackEventRequest = "SEND_TRACK_EVENT_REQUEST",
    SendTrackEventResponse = "SEND_TRACK_EVENT_RESPONSE",
    SendPageEventRequest = "SEND_PAGE_EVENT_REQUEST",
    SendPageEventResponse = "SEND_PAGE_EVENT_RESPONSE",
    SendPerformanceEventRequest = "SEND_PROOF_GENERATION_EVENT_REQUEST",
    SendPerformanceEventResponse = "SEND_PROOF_GENERATION_EVENT_RESPONSE",
    DecryptCiphertextsRequest = "DECRYPT_CIPHERTEXTS_REQUEST",
    DecryptCiphertextsResponse = "DECRYPT_CIPHERTEXTS_RESPONSE",
    GetOwnedRecordsRequest = "GET_OWNED_RECORDS_REQUEST",
    GetOwnedRecordsResponse = "GET_OWNED_RECORDS_RESPONSE"
}
export type AleoNotification = AleoStateUpdated;
export type AleoRequest = AleoAcknowledgeRequest | AleoGetStateRequest | AleoNewWalletRequest | AleoUnlockRequest | AleoLockRequest | AleoCreateAccountRequest | AleoUpdateCurrentAccountRequest | AleoRevealPublicKeyRequest | AleoRevealViewKeyRequest | AleoRevealPrivateKeyRequest | AleoRevealMnemonicRequest | AleoRemoveAccountRequest | AleoEditAccountRequest | AleoImportAccountRequest | AleoImportWatchOnlyAccountRequest | AleoImportMnemonicAccountRequest | AleoConfirmationRequest | AleoUpdateSettingsRequest | AleoAuthorizeRequest | AleoAuthorizeDeployRequest | AleoPageRequest | AleoDAppGetPayloadRequest | AleoDAppPermConfirmationRequest | AleoDAppSignConfirmationRequest | AleoDAppDecryptConfirmationRequest | AleoDAppRecordsConfirmationRequest | AleoDAppTransactionConfirmationRequest | AleoDAppBulkTransactionsConfirmationRequest | AleoDAppDeployConfirmationRequest | AleoGetAllDAppSessionsRequest | AleoRemoveDAppSessionRequest | AleoSendTrackEventRequest | AleoSendPageEventRequest | AleoSendPerformanceEventRequest | AleoDecryptCiphertextsRequest | AleoGetOwnedRecordsRequest;
export type AleoResponse<TRecord> = AleoAcknowledgeResponse | AleoLoadingResponse | AleoGetStateResponse | AleoNewWalletResponse | AleoUnlockResponse | AleoLockResponse | AleoCreateAccountResponse | AleoUpdateCurrentAccountResponse | AleoRevealPublicKeyResponse | AleoRevealViewKeyResponse | AleoRevealPrivateKeyResponse | AleoRevealMnemonicResponse | AleoRemoveAccountResponse | AleoEditAccountResponse | AleoImportAccountResponse | AleoImportWatchOnlyAccountResponse | AleoImportMnemonicAccountResponse | AleoConfirmationResponse | AleoUpdateSettingsResponse | AleoAuthorizeResponse | AleoAuthorizeDeployResponse | AleoPageResponse | AleoDAppGetPayloadResponse | AleoDAppPermConfirmationResponse | AleoDAppSignConfirmationResponse | AleoDAppDecryptConfirmationResponse | AleoDAppRecordsConfirmationResponse | AleoDAppTransactionConfirmationResponse | AleoDAppBulkTransactionsConfirmationResponse | AleoDAppDeployConfirmationResponse | AleoGetAllDAppSessionsResponse | AleoRemoveDAppSessionResponse | AleoSendTrackEventResponse | AleoSendPageEventResponse | AleoSendPerformanceEventResponse | AleoDecryptCiphertextsResponse | AleoGetOwnedRecordsResponse<TRecord>;
export interface AleoMessageBase {
    type: AleoMessageType;
}
export interface AleoAcknowledgeRequest extends AleoMessageBase {
    type: AleoMessageType.Acknowledge;
    origin: string;
    payload: any;
    beacon?: boolean;
    encrypted?: boolean;
}
export interface AleoAcknowledgeResponse extends AleoMessageBase {
    type: AleoMessageType.Acknowledge;
    payload: string;
    encrypted?: boolean;
}
export interface AleoStateUpdated extends AleoMessageBase {
    type: AleoMessageType.StateUpdated;
}
export interface AleoGetStateRequest extends AleoMessageBase {
    type: AleoMessageType.GetStateRequest;
}
export interface AleoGetStateResponse extends AleoMessageBase {
    type: AleoMessageType.GetStateResponse;
    state: AleoState;
}
export interface AleoLoadingResponse extends AleoMessageBase {
    type: AleoMessageType.LoadingResponse;
}
export interface AleoNewWalletRequest extends AleoMessageBase {
    type: AleoMessageType.NewWalletRequest;
    password: string;
    mnemonic?: string;
    ownMnemonic?: boolean;
}
export interface AleoNewWalletResponse extends AleoMessageBase {
    type: AleoMessageType.NewWalletResponse;
}
export interface AleoUnlockRequest extends AleoMessageBase {
    type: AleoMessageType.UnlockRequest;
    password: string;
}
export interface AleoUnlockResponse extends AleoMessageBase {
    type: AleoMessageType.UnlockResponse;
}
export interface AleoLockRequest extends AleoMessageBase {
    type: AleoMessageType.LockRequest;
}
export interface AleoLockResponse extends AleoMessageBase {
    type: AleoMessageType.LockResponse;
}
export interface AleoCreateAccountRequest extends AleoMessageBase {
    type: AleoMessageType.CreateAccountRequest;
    name?: string;
}
export interface AleoCreateAccountResponse extends AleoMessageBase {
    type: AleoMessageType.CreateAccountResponse;
}
export interface AleoUpdateCurrentAccountRequest extends AleoMessageBase {
    type: AleoMessageType.UpdateCurrentAccountRequest;
    accountPublicKey: string;
}
export interface AleoUpdateCurrentAccountResponse extends AleoMessageBase {
    type: AleoMessageType.UpdateCurrentAccountResponse;
}
export interface AleoRevealPublicKeyRequest extends AleoMessageBase {
    type: AleoMessageType.RevealPublicKeyRequest;
    accountPublicKey: string;
}
export interface AleoRevealPublicKeyResponse extends AleoMessageBase {
    type: AleoMessageType.RevealPublicKeyResponse;
    publicKey: string;
}
export interface AleoRevealViewKeyRequest extends AleoMessageBase {
    type: AleoMessageType.RevealViewKeyRequest;
    accountPublicKey: string;
    password: string;
}
export interface AleoRevealViewKeyResponse extends AleoMessageBase {
    type: AleoMessageType.RevealViewKeyResponse;
    viewKey: string;
}
export interface AleoRevealPrivateKeyRequest extends AleoMessageBase {
    type: AleoMessageType.RevealPrivateKeyRequest;
    accountPublicKey: string;
    password: string;
}
export interface AleoRevealPrivateKeyResponse extends AleoMessageBase {
    type: AleoMessageType.RevealPrivateKeyResponse;
    privateKey: string;
}
export interface AleoRevealMnemonicRequest extends AleoMessageBase {
    type: AleoMessageType.RevealMnemonicRequest;
    password: string;
}
export interface AleoRevealMnemonicResponse extends AleoMessageBase {
    type: AleoMessageType.RevealMnemonicResponse;
    mnemonic: string;
}
export interface AleoRemoveAccountRequest extends AleoMessageBase {
    type: AleoMessageType.RemoveAccountRequest;
    accountPublicKey: string;
    password: string;
}
export interface AleoRemoveAccountResponse extends AleoMessageBase {
    type: AleoMessageType.RemoveAccountResponse;
}
export interface AleoEditAccountRequest extends AleoMessageBase {
    type: AleoMessageType.EditAccountRequest;
    accountPublicKey: string;
    name: string;
}
export interface AleoEditAccountResponse extends AleoMessageBase {
    type: AleoMessageType.EditAccountResponse;
}
export interface AleoImportAccountRequest extends AleoMessageBase {
    type: AleoMessageType.ImportAccountRequest;
    privateKey: string;
    encPassword?: string;
}
export interface AleoImportAccountResponse extends AleoMessageBase {
    type: AleoMessageType.ImportAccountResponse;
}
export interface AleoImportWatchOnlyAccountRequest extends AleoMessageBase {
    type: AleoMessageType.ImportWatchOnlyAccountRequest;
    viewKey: string;
}
export interface AleoImportWatchOnlyAccountResponse extends AleoMessageBase {
    type: AleoMessageType.ImportWatchOnlyAccountResponse;
}
export interface AleoImportMnemonicAccountRequest extends AleoMessageBase {
    type: AleoMessageType.ImportMnemonicAccountRequest;
    mnemonic: string;
    password?: string;
    derivationPath?: string;
}
export interface AleoImportMnemonicAccountResponse extends AleoMessageBase {
    type: AleoMessageType.ImportMnemonicAccountResponse;
}
export interface AleoUpdateSettingsRequest extends AleoMessageBase {
    type: AleoMessageType.UpdateSettingsRequest;
    settings: Partial<AleoSettings>;
}
export interface AleoUpdateSettingsResponse extends AleoMessageBase {
    type: AleoMessageType.UpdateSettingsResponse;
}
export interface AleoAuthorizeRequest extends AleoMessageBase {
    type: AleoMessageType.AuthorizeRequest;
    accPublicKey: string;
    program: string;
    functionName: string;
    inputs: string[];
    feeCredits: number;
    feeRecord?: string;
    imports?: {
        [key: string]: string;
    };
}
export interface AleoAuthorizeResponse extends AleoMessageBase {
    type: AleoMessageType.AuthorizeResponse;
    authorization: string;
    feeAuthorization: string;
}
export interface AleoAuthorizeDeployRequest extends AleoMessageBase {
    type: AleoMessageType.AuthorizeDeployRequest;
    accPublicKey: string;
    deployment: string;
    feeCredits: number;
    feeRecord?: string;
}
export interface AleoAuthorizeDeployResponse extends AleoMessageBase {
    type: AleoMessageType.AuthorizeDeployResponse;
    deployment: string;
    feeAuthorization: string;
    owner: string;
}
export interface AleoConfirmationRequest extends AleoMessageBase {
    type: AleoMessageType.ConfirmationRequest;
    id: string;
    confirmed: boolean;
    modifiedTotalFee?: number;
    modifiedStorageLimit?: number;
}
export interface AleoConfirmationResponse extends AleoMessageBase {
    type: AleoMessageType.ConfirmationResponse;
}
export interface AleoPageRequest extends AleoMessageBase {
    type: AleoMessageType.PageRequest;
    origin: string;
    payload: any;
    beacon?: boolean;
    encrypted?: boolean;
}
export interface AleoPageResponse extends AleoMessageBase {
    type: AleoMessageType.PageResponse;
    payload: any;
    encrypted?: boolean;
}
export interface AleoDAppGetPayloadRequest extends AleoMessageBase {
    type: AleoMessageType.DAppGetPayloadRequest;
    id: string;
}
export interface AleoDAppGetPayloadResponse extends AleoMessageBase {
    type: AleoMessageType.DAppGetPayloadResponse;
    payload: AleoDAppPayload;
    decryptPermission: DecryptPermission;
}
export interface AleoDAppPermConfirmationRequest extends AleoMessageBase {
    type: AleoMessageType.DAppPermConfirmationRequest;
    id: string;
    confirmed: boolean;
    accountPublicKey: string;
    decryptPermission: DecryptPermission;
}
export interface AleoDAppPermConfirmationResponse extends AleoMessageBase {
    type: AleoMessageType.DAppPermConfirmationResponse;
    viewKey?: string;
}
export interface AleoDAppSignConfirmationRequest extends AleoMessageBase {
    type: AleoMessageType.DAppSignConfirmationRequest;
    id: string;
    confirmed: boolean;
}
export interface AleoDAppSignConfirmationResponse extends AleoMessageBase {
    type: AleoMessageType.DAppSignConfirmationResponse;
}
export interface AleoDAppDecryptConfirmationRequest extends AleoMessageBase {
    type: AleoMessageType.DAppDecryptConfirmationRequest;
    id: string;
    confirmed: boolean;
}
export interface AleoDAppDecryptConfirmationResponse extends AleoMessageBase {
    type: AleoMessageType.DAppDecryptConfirmationResponse;
}
export interface AleoDAppRecordsConfirmationRequest extends AleoMessageBase {
    type: AleoMessageType.DAppRecordsConfirmationRequest;
    id: string;
    confirmed: boolean;
}
export interface AleoDAppRecordsConfirmationResponse extends AleoMessageBase {
    type: AleoMessageType.DAppRecordsConfirmationResponse;
}
export interface AleoDAppTransactionConfirmationRequest extends AleoMessageBase {
    type: AleoMessageType.DAppTransactionConfirmationRequest;
    id: string;
    confirmed: boolean;
    delegate: boolean;
}
export interface AleoDAppTransactionConfirmationResponse extends AleoMessageBase {
    type: AleoMessageType.DAppTransactionConfirmationResponse;
}
export interface AleoDAppBulkTransactionsConfirmationRequest extends AleoMessageBase {
    type: AleoMessageType.DAppBulkTransactionsConfirmationRequest;
    id: string;
    confirmed: boolean;
    delegate: boolean;
}
export interface AleoDAppBulkTransactionsConfirmationResponse extends AleoMessageBase {
    type: AleoMessageType.DAppBulkTransactionsConfirmationResponse;
}
export interface AleoDAppDeployConfirmationRequest extends AleoMessageBase {
    type: AleoMessageType.DAppDeployConfirmationRequest;
    id: string;
    confirmed: boolean;
    delegate: boolean;
}
export interface AleoDAppDeployConfirmationResponse extends AleoMessageBase {
    type: AleoMessageType.DAppDeployConfirmationResponse;
}
export interface AleoGetAllDAppSessionsRequest extends AleoMessageBase {
    type: AleoMessageType.DAppGetAllSessionsRequest;
}
export interface AleoGetAllDAppSessionsResponse extends AleoMessageBase {
    type: AleoMessageType.DAppGetAllSessionsResponse;
    sessions: AleoDAppSessions;
}
export interface AleoRemoveDAppSessionRequest extends AleoMessageBase {
    type: AleoMessageType.DAppRemoveSessionRequest;
    origin: string;
}
export interface AleoRemoveDAppSessionResponse extends AleoMessageBase {
    type: AleoMessageType.DAppRemoveSessionResponse;
    sessions: AleoDAppSessions;
}
export interface AleoDecryptCiphertextsRequest extends AleoMessageBase {
    type: AleoMessageType.DecryptCiphertextsRequest;
    accPublicKey: string;
    ciphertexts: string[];
}
export interface AleoDecryptCiphertextsResponse extends AleoMessageBase {
    type: AleoMessageType.DecryptCiphertextsResponse;
    texts: {
        ciphertext: string;
        plaintext: string;
    }[];
}
export interface AleoGetOwnedRecordsRequest extends AleoMessageBase {
    type: AleoMessageType.GetOwnedRecordsRequest;
    accPublicKey: string;
}
export interface AleoGetOwnedRecordsResponse<TRecord> extends AleoMessageBase {
    type: AleoMessageType.GetOwnedRecordsResponse;
    records: TRecord[];
}
export declare enum ImportAccountFormType {
    PrivateKey = "ImportAccountFormType.PrivateKey",
    Mnemonic = "ImportAccountFormType.Mnemonic",
    WatchOnly = "WatchOnly"
}
export interface AleoAlias {
    alias?: string;
    address: string;
}
export interface AleoTokenTransfer {
    amount: string;
    from: AleoAlias;
    id: number;
    level: number;
    timestamp: string;
    to: AleoAlias;
    token: {
        contract: AleoAlias;
        id: number;
        metadata: {
            name: string;
            symbol: string;
            decimals: string;
            thumbnailUri?: string;
            eth_name?: string;
            eth_symbol?: string;
            eth_contract?: string;
        };
        standard: string;
        tokenId: string;
    };
    transactionId: number;
}
export interface MtspPlaintextRecord {
    owner: string;
    amount: string;
    token_id: string;
    external_authorization_required: string;
    authorized_until: string;
}
export {};
//# sourceMappingURL=types.d.ts.map