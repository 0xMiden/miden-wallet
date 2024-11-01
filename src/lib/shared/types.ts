import { IRecord } from 'lib/miden/db/types';
import {
  SendPageEventRequest,
  SendPageEventResponse,
  SendPerformanceEventRequest,
  SendPerformanceEventResponse,
  SendTrackEventRequest,
  SendTrackEventResponse
} from './analytics-types';

export enum WalletMessageType {
  // Aknowledge
  Acknowledge = 'CONNECT_AKNOWLEDGE',
  // Notifications
  StateUpdated = 'STATE_UPDATED',
  // Generic Responses
  LoadingResponse = 'LOADING_RESPONSE',
  // Request-Response pairs
  GetStateRequest = 'GET_STATE_REQUEST',
  GetStateResponse = 'GET_STATE_RESPONSE',
  NewWalletRequest = 'NEW_WALLET_REQUEST',
  NewWalletResponse = 'NEW_WALLET_RESPONSE',
  UnlockRequest = 'UNLOCK_REQUEST',
  UnlockResponse = 'UNLOCK_RESPONSE',
  LockRequest = 'LOCK_REQUEST',
  LockResponse = 'LOCK_RESPONSE',
  CreateAccountRequest = 'CREATE_ACCOUNT_REQUEST',
  CreateAccountResponse = 'CREATE_ACCOUNT_RESPONSE',
  UpdateCurrentAccountRequest = 'UPDATE_CURRENT_ACCOUNT_REQUEST',
  UpdateCurrentAccountResponse = 'UPDATE_CURRENT_ACCOUNT_RESPONSE',
  RevealPublicKeyRequest = 'REVEAL_PUBLIC_KEY_REQUEST',
  RevealPublicKeyResponse = 'REVEAL_PUBLIC_KEY_RESPONSE',
  RevealViewKeyRequest = 'REVEAL_VIEW_KEY_REQUEST',
  RevealViewKeyResponse = 'REVEAL_VIEW_KEY_RESPONSE',
  RevealPrivateKeyRequest = 'REVEAL_PRIVATE_KEY_REQUEST',
  RevealPrivateKeyResponse = 'REVEAL_PRIVATE_KEY_RESPONSE',
  RevealMnemonicRequest = 'REVEAL_MNEMONIC_REQUEST',
  RevealMnemonicResponse = 'REVEAL_MNEMONIC_RESPONSE',
  RemoveAccountRequest = 'REMOVE_ACCOUNT_REQUEST',
  RemoveAccountResponse = 'REMOVE_ACCOUNT_RESPONSE',
  EditAccountRequest = 'EDIT_ACCOUNT_REQUEST',
  EditAccountResponse = 'EDIT_ACCOUNT_RESPONSE',
  ImportAccountRequest = 'IMPORT_ACCOUNT_REQUEST',
  ImportAccountResponse = 'IMPORT_ACCOUNT_RESPONSE',
  ImportWatchOnlyAccountRequest = 'IMPORT_WATCH_ONLY_ACCOUNT_REQUEST',
  ImportWatchOnlyAccountResponse = 'IMPORT_WATCH_ONLY_ACCOUNT_RESPONSE',
  ImportMnemonicAccountRequest = 'IMPORT_MNEMONIC_ACCOUNT_REQUEST',
  ImportMnemonicAccountResponse = 'IMPORT_MNEMONIC_ACCOUNT_RESPONSE',
  UpdateSettingsRequest = 'UPDATE_SETTINGS_REQUEST',
  UpdateSettingsResponse = 'UPDATE_SETTINGS_RESPONSE',
  AuthorizeRequest = 'AUTHORIZE_REQUEST',
  AuthorizeResponse = 'AUTHORIZE_RESPONSE',
  AuthorizeDeployRequest = 'AUTHORIZE_DEPLOY_REQUEST',
  AuthorizeDeployResponse = 'AUTHORIZE_DEPLOY_RESPONSE',
  ConfirmationRequest = 'CONFIRMATION_REQUEST',
  ConfirmationResponse = 'CONFIRMATION_RESPONSE',
  PageRequest = 'PAGE_REQUEST',
  PageResponse = 'PAGE_RESPONSE',
  DAppGetPayloadRequest = 'DAPP_GET_PAYLOAD_REQUEST',
  DAppGetPayloadResponse = 'DAPP_GET_PAYLOAD_RESPONSE',
  DAppPermConfirmationRequest = 'DAPP_PERM_CONFIRMATION_REQUEST',
  DAppPermConfirmationResponse = 'DAPP_PERM_CONFIRMATION_RESPONSE',
  DAppSignConfirmationRequest = 'DAPP_SIGN_CONFIRMATION_REQUEST',
  DAppSignConfirmationResponse = 'DAPP_SIGN_CONFIRMATION_RESPONSE',
  DAppDecryptConfirmationRequest = 'DAPP_DECRYPT_CONFIRMATION_REQUEST',
  DAppDecryptConfirmationResponse = 'DAPP_DECRYPT_CONFIRMATION_RESPONSE',
  DAppRecordsConfirmationRequest = 'DAPP_RECORDS_CONFIRMATION_REQUEST',
  DAppRecordsConfirmationResponse = 'DAPP_RECORDS_CONFIRMATION_RESPONSE',
  DAppTransactionConfirmationRequest = 'DAPP_TRANSACTION_CONFIRMATION_REQUEST',
  DAppTransactionConfirmationResponse = 'DAPP_TRANSACTION_CONFIRMATION_RESPONSE',
  DAppBulkTransactionsConfirmationRequest = 'DAPP_BULK_TRANSACTIONS_CONFIRMATION_REQUEST',
  DAppBulkTransactionsConfirmationResponse = 'DAPP_BULK_TRANSACTIONS_CONFIRMATION_RESPONSE',
  DAppDeployConfirmationRequest = 'DAPP_DEPLOY_CONFIRMATION_REQUEST',
  DAppDeployConfirmationResponse = 'DAPP_DEPLOY_CONFIRMATION_RESPONSE',
  DAppGetAllSessionsRequest = 'DAPP_GET_ALL_SESSIONS_REQUEST',
  DAppGetAllSessionsResponse = 'DAPP_GET_ALL_SESSIONS_RESPONSE',
  DAppRemoveSessionRequest = 'DAPP_REMOVE_SESSION_REQUEST',
  DAppRemoveSessionResponse = 'DAPP_REMOVE_SESSION_RESPONSE',
  SendTrackEventRequest = 'SEND_TRACK_EVENT_REQUEST',
  SendTrackEventResponse = 'SEND_TRACK_EVENT_RESPONSE',
  SendPageEventRequest = 'SEND_PAGE_EVENT_REQUEST',
  SendPageEventResponse = 'SEND_PAGE_EVENT_RESPONSE',
  SendPerformanceEventRequest = 'SEND_PROOF_GENERATION_EVENT_REQUEST',
  SendPerformanceEventResponse = 'SEND_PROOF_GENERATION_EVENT_RESPONSE',
  DecryptCiphertextsRequest = 'DECRYPT_CIPHERTEXTS_REQUEST',
  DecryptCiphertextsResponse = 'DECRYPT_CIPHERTEXTS_RESPONSE',
  GetOwnedRecordsRequest = 'GET_OWNED_RECORDS_REQUEST',
  GetOwnedRecordsResponse = 'GET_OWNED_RECORDS_RESPONSE'
}

export type WalletNotification = StateUpdated;

export interface WalletMessageBase {
  type: WalletMessageType;
}

export interface AcknowledgeRequest extends WalletMessageBase {
  type: WalletMessageType.Acknowledge;
  origin: string;
  payload: any;
  beacon?: boolean;
  encrypted?: boolean;
}

export interface AcknowledgeResponse extends WalletMessageBase {
  type: WalletMessageType.Acknowledge;
  payload: string;
  encrypted?: boolean;
}

export interface StateUpdated extends WalletMessageBase {
  type: WalletMessageType.StateUpdated;
}

export interface GetStateRequest extends WalletMessageBase {
  type: WalletMessageType.GetStateRequest;
  // TODO: Add an enum param here for determining "which wallet" i.e. Aleo vs Miden
}

export interface GetStateResponse extends WalletMessageBase {
  type: WalletMessageType.GetStateResponse;
  state: WalletState;
}

// TODO: Make generalizable and pull out somewhere
export interface WalletState {
  status: WalletStatus;
  accounts: WalletAccount[]; // Miden sdk might soon export a type for this
  networks: WalletNetwork[];
  settings: WalletSettings | null; // TODO: Do we want settings on the state
  currentAccount: WalletAccount | null; // Miden sdk might soon export a type for this
  ownMnemonic: boolean | null; // TODO: Will be boolean in future if used. For seed phrase logic
}

type NonEmptyArray<T> = [T, ...T[]];
export interface ReadyWalletState extends WalletState {
  status: WalletStatus.Ready;
  accounts: NonEmptyArray<WalletAccount>;
  networks: NonEmptyArray<WalletNetwork>;
  settings: WalletSettings;
  currentAccount: WalletAccount;
}

export interface WalletAccount {
  id: string;
  publicKey: string;
  privateKey: string;
  name: string;
}

export interface WalletNetwork {
  rpcBaseURL: string;
  id: string;
  name: string;
  autoSync: boolean;
}

export interface LoadingResponse extends WalletMessageBase {
  type: WalletMessageType.LoadingResponse;
}

export interface NewWalletRequest extends WalletMessageBase {
  type: WalletMessageType.NewWalletRequest;
  password: string;
  mnemonic?: string;
  ownMnemonic?: boolean;
}

export interface NewWalletResponse extends WalletMessageBase {
  type: WalletMessageType.NewWalletResponse;
}

export interface UnlockRequest extends WalletMessageBase {
  type: WalletMessageType.UnlockRequest;
  password: string;
}

export interface UnlockResponse extends WalletMessageBase {
  type: WalletMessageType.UnlockResponse;
}

export interface LockRequest extends WalletMessageBase {
  type: WalletMessageType.LockRequest;
}

export interface LockResponse extends WalletMessageBase {
  type: WalletMessageType.LockResponse;
}

export interface CreateAccountRequest extends WalletMessageBase {
  type: WalletMessageType.CreateAccountRequest;
  name?: string;
}

export interface CreateAccountResponse extends WalletMessageBase {
  type: WalletMessageType.CreateAccountResponse;
}

export interface UpdateCurrentAccountRequest extends WalletMessageBase {
  type: WalletMessageType.UpdateCurrentAccountRequest;
  accountPublicKey: string;
}

export interface UpdateCurrentAccountResponse extends WalletMessageBase {
  type: WalletMessageType.UpdateCurrentAccountResponse;
}

export interface RevealPublicKeyRequest extends WalletMessageBase {
  type: WalletMessageType.RevealPublicKeyRequest;
  accountPublicKey: string;
}

export interface RevealPublicKeyResponse extends WalletMessageBase {
  type: WalletMessageType.RevealPublicKeyResponse;
  publicKey: string;
}

export interface RevealViewKeyRequest extends WalletMessageBase {
  type: WalletMessageType.RevealViewKeyRequest;
  accountPublicKey: string;
  password: string;
}

export interface RevealViewKeyResponse extends WalletMessageBase {
  type: WalletMessageType.RevealViewKeyResponse;
  viewKey: string;
}

export interface RevealPrivateKeyRequest extends WalletMessageBase {
  type: WalletMessageType.RevealPrivateKeyRequest;
  accountPublicKey: string;
  password: string;
}

export interface RevealPrivateKeyResponse extends WalletMessageBase {
  type: WalletMessageType.RevealPrivateKeyResponse;
  privateKey: string;
}

export interface RevealMnemonicRequest extends WalletMessageBase {
  type: WalletMessageType.RevealMnemonicRequest;
  password: string;
}

export interface RevealMnemonicResponse extends WalletMessageBase {
  type: WalletMessageType.RevealMnemonicResponse;
  mnemonic: string;
}

export interface RemoveAccountRequest extends WalletMessageBase {
  type: WalletMessageType.RemoveAccountRequest;
  accountPublicKey: string;
  password: string;
}

export interface RemoveAccountResponse extends WalletMessageBase {
  type: WalletMessageType.RemoveAccountResponse;
}

export interface EditAccountRequest extends WalletMessageBase {
  type: WalletMessageType.EditAccountRequest;
  accountPublicKey: string;
  name: string;
}

export interface EditAccountResponse extends WalletMessageBase {
  type: WalletMessageType.EditAccountResponse;
}

export interface ImportAccountRequest extends WalletMessageBase {
  type: WalletMessageType.ImportAccountRequest;
  privateKey: string;
  encPassword?: string;
}

export interface ImportAccountResponse extends WalletMessageBase {
  type: WalletMessageType.ImportAccountResponse;
}

export interface ImportWatchOnlyAccountRequest extends WalletMessageBase {
  type: WalletMessageType.ImportWatchOnlyAccountRequest;
  viewKey: string;
}

export interface ImportWatchOnlyAccountResponse extends WalletMessageBase {
  type: WalletMessageType.ImportWatchOnlyAccountResponse;
}

export interface ImportMnemonicAccountRequest extends WalletMessageBase {
  type: WalletMessageType.ImportMnemonicAccountRequest;
  mnemonic: string;
  password?: string;
  derivationPath?: string;
}

export interface ImportMnemonicAccountResponse extends WalletMessageBase {
  type: WalletMessageType.ImportMnemonicAccountResponse;
}

export interface UpdateSettingsRequest extends WalletMessageBase {
  type: WalletMessageType.UpdateSettingsRequest;
  settings: Partial<WalletSettings>;
}

// TODO: Pull this out somewhere and make it more generalizable
export interface WalletSettings {}

export interface UpdateSettingsResponse extends WalletMessageBase {
  type: WalletMessageType.UpdateSettingsResponse;
}

export interface AuthorizeRequest extends WalletMessageBase {
  type: WalletMessageType.AuthorizeRequest;
  accPublicKey: string;
  program: string;
  functionName: string;
  inputs: string[];
  feeCredits: number;
  feeRecord?: string;
  imports?: { [key: string]: string };
}

export interface AuthorizeResponse extends WalletMessageBase {
  type: WalletMessageType.AuthorizeResponse;
  authorization: string;
  feeAuthorization: string;
}

export interface AuthorizeDeployRequest extends WalletMessageBase {
  type: WalletMessageType.AuthorizeDeployRequest;
  accPublicKey: string;
  deployment: string;
  feeCredits: number;
  feeRecord?: string;
}

export interface AuthorizeDeployResponse extends WalletMessageBase {
  type: WalletMessageType.AuthorizeDeployResponse;
  deployment: string;
  feeAuthorization: string;
  owner: string;
}

export interface ConfirmationRequest extends WalletMessageBase {
  type: WalletMessageType.ConfirmationRequest;
  id: string;
  confirmed: boolean;
  modifiedTotalFee?: number;
  modifiedStorageLimit?: number;
}

export interface ConfirmationResponse extends WalletMessageBase {
  type: WalletMessageType.ConfirmationResponse;
}

export interface PageRequest extends WalletMessageBase {
  type: WalletMessageType.PageRequest;
  origin: string;
  payload: any;
  beacon?: boolean;
  encrypted?: boolean;
}

export interface PageResponse extends WalletMessageBase {
  type: WalletMessageType.PageResponse;
  payload: any;
  encrypted?: boolean;
}

export interface DAppGetPayloadRequest extends WalletMessageBase {
  type: WalletMessageType.DAppGetPayloadRequest;
  id: string;
}

export interface DAppGetPayloadResponse<T> extends WalletMessageBase {
  type: WalletMessageType.DAppGetPayloadResponse;
  payload: T;
}

export interface DAppPermConfirmationRequest extends WalletMessageBase {
  type: WalletMessageType.DAppPermConfirmationRequest;
  id: string;
  confirmed: boolean;
  accountPublicKey: string;
  // decryptPermission: DecryptPermission;
}

export interface DAppPermConfirmationResponse extends WalletMessageBase {
  type: WalletMessageType.DAppPermConfirmationResponse;
  viewKey?: string;
}

export interface DAppSignConfirmationRequest extends WalletMessageBase {
  type: WalletMessageType.DAppSignConfirmationRequest;
  id: string;
  confirmed: boolean;
}

export interface DAppSignConfirmationResponse extends WalletMessageBase {
  type: WalletMessageType.DAppSignConfirmationResponse;
}

export interface DAppDecryptConfirmationRequest extends WalletMessageBase {
  type: WalletMessageType.DAppDecryptConfirmationRequest;
  id: string;
  confirmed: boolean;
}

export interface DAppDecryptConfirmationResponse extends WalletMessageBase {
  type: WalletMessageType.DAppDecryptConfirmationResponse;
}

export interface DAppRecordsConfirmationRequest extends WalletMessageBase {
  type: WalletMessageType.DAppRecordsConfirmationRequest;
  id: string;
  confirmed: boolean;
}

export interface DAppRecordsConfirmationResponse extends WalletMessageBase {
  type: WalletMessageType.DAppRecordsConfirmationResponse;
}

export interface DAppTransactionConfirmationRequest extends WalletMessageBase {
  type: WalletMessageType.DAppTransactionConfirmationRequest;
  id: string;
  confirmed: boolean;
  delegate: boolean;
}

export interface DAppTransactionConfirmationResponse extends WalletMessageBase {
  type: WalletMessageType.DAppTransactionConfirmationResponse;
}

export interface DAppBulkTransactionsConfirmationRequest extends WalletMessageBase {
  type: WalletMessageType.DAppBulkTransactionsConfirmationRequest;
  id: string;
  confirmed: boolean;
  delegate: boolean;
}

export interface DAppBulkTransactionsConfirmationResponse extends WalletMessageBase {
  type: WalletMessageType.DAppBulkTransactionsConfirmationResponse;
}

export interface DAppDeployConfirmationRequest extends WalletMessageBase {
  type: WalletMessageType.DAppDeployConfirmationRequest;
  id: string;
  confirmed: boolean;
  delegate: boolean;
}

export interface DAppDeployConfirmationResponse extends WalletMessageBase {
  type: WalletMessageType.DAppDeployConfirmationResponse;
}

export interface GetAllDAppSessionsRequest extends WalletMessageBase {
  type: WalletMessageType.DAppGetAllSessionsRequest;
}

export interface GetAllDAppSessionsResponse<T> extends WalletMessageBase {
  type: WalletMessageType.DAppGetAllSessionsResponse;
  sessions: T;
}

export interface RemoveDAppSessionRequest extends WalletMessageBase {
  type: WalletMessageType.DAppRemoveSessionRequest;
  origin: string;
}

export interface RemoveDAppSessionResponse<T> extends WalletMessageBase {
  type: WalletMessageType.DAppRemoveSessionResponse;
  sessions: T;
}

export interface DecryptCiphertextsRequest extends WalletMessageBase {
  type: WalletMessageType.DecryptCiphertextsRequest;
  accPublicKey: string;
  ciphertexts: string[];
}

export interface DecryptCiphertextsResponse extends WalletMessageBase {
  type: WalletMessageType.DecryptCiphertextsResponse;
  texts: { ciphertext: string; plaintext: string }[];
}

export interface GetOwnedRecordsRequest extends WalletMessageBase {
  type: WalletMessageType.GetOwnedRecordsRequest;
  accPublicKey: string;
}

export interface GetOwnedRecordsResponse extends WalletMessageBase {
  type: WalletMessageType.GetOwnedRecordsResponse;
  records: IRecord[];
}

export enum WalletStatus {
  Idle,
  Locked,
  Ready
}

export type WalletRequest =
  | AcknowledgeRequest
  | GetStateRequest
  | NewWalletRequest
  | UnlockRequest
  | LockRequest
  | CreateAccountRequest
  | UpdateCurrentAccountRequest
  | RevealPublicKeyRequest
  | RevealViewKeyRequest
  | RevealPrivateKeyRequest
  | RevealMnemonicRequest
  | RemoveAccountRequest
  | EditAccountRequest
  | ImportAccountRequest
  | ImportWatchOnlyAccountRequest
  | ImportMnemonicAccountRequest
  | ConfirmationRequest
  | UpdateSettingsRequest
  | AuthorizeRequest
  | AuthorizeDeployRequest
  | PageRequest
  | DAppGetPayloadRequest
  | DAppPermConfirmationRequest
  | DAppSignConfirmationRequest
  | DAppDecryptConfirmationRequest
  | DAppRecordsConfirmationRequest
  | DAppTransactionConfirmationRequest
  | DAppBulkTransactionsConfirmationRequest
  | DAppDeployConfirmationRequest
  | GetAllDAppSessionsRequest
  | RemoveDAppSessionRequest
  | SendTrackEventRequest
  | SendPageEventRequest
  | SendPerformanceEventRequest
  | DecryptCiphertextsRequest
  | GetOwnedRecordsRequest;

export type WalletResponse =
  | AcknowledgeResponse
  | LoadingResponse
  | GetStateResponse
  | NewWalletResponse
  | UnlockResponse
  | LockResponse
  | CreateAccountResponse
  | UpdateCurrentAccountResponse
  | RevealPublicKeyResponse
  | RevealViewKeyResponse
  | RevealPrivateKeyResponse
  | RevealMnemonicResponse
  | RemoveAccountResponse
  | EditAccountResponse
  | ImportAccountResponse
  | ImportWatchOnlyAccountResponse
  | ImportMnemonicAccountResponse
  | ConfirmationResponse
  | UpdateSettingsResponse
  | AuthorizeResponse
  | AuthorizeDeployResponse
  | PageResponse
  //   | DAppGetPayloadResponse
  | DAppPermConfirmationResponse
  | DAppSignConfirmationResponse
  | DAppDecryptConfirmationResponse
  | DAppRecordsConfirmationResponse
  | DAppTransactionConfirmationResponse
  | DAppBulkTransactionsConfirmationResponse
  | DAppDeployConfirmationResponse
  //   | GetAllDAppSessionsResponse
  // | RemoveDAppSessionResponse
  | SendTrackEventResponse
  | SendPageEventResponse
  | SendPerformanceEventResponse
  | DecryptCiphertextsResponse
  | GetOwnedRecordsResponse;
