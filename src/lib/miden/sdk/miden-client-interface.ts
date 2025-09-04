import {
  Account,
  AccountId,
  AccountInterface,
  AccountStorageMode,
  ConsumableNoteRecord,
  InputNoteRecord,
  NetworkId,
  NoteFilter,
  TransactionFilter,
  TransactionProver,
  TransactionRequest,
  TransactionResult,
  WebClient
} from '@demox-labs/miden-sdk';

import { MIDEN_NETWORK_ENDPOINTS, MIDEN_NETWORK_NAME, MIDEN_PROVING_ENDPOINTS } from 'lib/miden-chain/constants';
import { WalletType } from 'screens/onboarding/types';

import { ConsumeTransaction, SendTransaction } from '../db/types';
import { toNoteType } from '../helpers';
import { NoteExportType } from './constants';

export type MidenClientCreateOptions = {
  seed?: Uint8Array;
  onConnectivityIssue?: () => void;
};

export class MidenClientInterface {
  webClient: WebClient;
  network: string;
  onConnectivityIssue?: () => void;

  private constructor(webClient: WebClient, network: string, onConnectivityIssue?: () => void) {
    this.webClient = webClient;
    this.network = network;
    this.onConnectivityIssue = onConnectivityIssue;
  }

  static async create(options: MidenClientCreateOptions = {}) {
    const seed = options.seed?.toString();
    const network = MIDEN_NETWORK_NAME.DEVNET;
    const webClient = await WebClient.createClient(MIDEN_NETWORK_ENDPOINTS.get(network)!, seed);

    return new MidenClientInterface(webClient, network, options.onConnectivityIssue);
  }

  async createMidenWallet(walletType: WalletType, seed?: Uint8Array): Promise<string> {
    // Create a new wallet
    const accountStorageMode =
      walletType === WalletType.OnChain ? AccountStorageMode.public() : AccountStorageMode.private();

    const wallet: Account = await this.webClient.newWallet(accountStorageMode, true, seed);
    const walletId = wallet.id().toBech32(NetworkId.Devnet, AccountInterface.BasicWallet);

    return walletId;
  }

  async importMidenWallet(accountBytes: Uint8Array): Promise<string> {
    const wallet: Account = await this.webClient.importAccountFile(accountBytes);
    const walletIdString = wallet.id().toBech32(NetworkId.Devnet, AccountInterface.BasicWallet);

    return walletIdString;
  }

  async importPublicMidenWalletFromSeed(seed: Uint8Array) {
    const account = await this.webClient.importPublicAccountFromSeed(seed, true);

    return account.id().toBech32(NetworkId.Devnet, AccountInterface.BasicWallet);
  }

  async consumeTransaction(accountId: string, listOfNoteIds: string[], delegateTransaction?: boolean) {
    console.log('Consuming transaction...');
    console.log('listOfNoteIds', listOfNoteIds);
    const consumeTransactionRequest = this.webClient.newConsumeTransactionRequest(listOfNoteIds);
    let consumeTransactionResult = await this.webClient.newTransaction(
      accountIdStringToSdk(accountId),
      consumeTransactionRequest
    );
    await this.submitTransactionWithFallback(consumeTransactionResult, delegateTransaction);
    return consumeTransactionResult;
  }

  async importNoteBytes(noteBytes: Uint8Array) {
    console.log('Importing note...');
    const result = await this.webClient.importNoteFile(noteBytes);
    console.log('Imported note:', result);
    return result;
  }

  async consumeNoteId(transaction: ConsumeTransaction): Promise<TransactionResult> {
    const { accountId, noteId, delegateTransaction } = transaction;
    console.log('Consuming note:', noteId);
    console.log('accountId', accountId);

    const consumeTransactionRequest = this.webClient.newConsumeTransactionRequest([noteId]);
    let consumeTransactionResult = await this.webClient.newTransaction(
      accountIdStringToSdk(accountId),
      consumeTransactionRequest
    );
    await this.submitTransactionWithFallback(consumeTransactionResult, delegateTransaction);

    return consumeTransactionResult;
  }

  async getAccount(accountId: string) {
    const result = await this.webClient.getAccount(accountIdStringToSdk(accountId));
    return result;
  }

  async importAccountById(accountId: string) {
    const result = await this.webClient.importAccountById(accountIdStringToSdk(accountId));
    return result;
  }

  async getAccounts() {
    const result = await this.webClient.getAccounts();
    return result;
  }

  async getInputNotes(noteFilter: NoteFilter): Promise<InputNoteRecord[]> {
    const result = await this.webClient.getInputNotes(noteFilter);
    return result;
  }

  async syncState() {
    return await this.webClient.syncState();
  }

  async exportNote(noteId: string, exportType: NoteExportType): Promise<Uint8Array> {
    const result = await this.webClient.exportNoteFile(noteId, exportType);
    const byteArray = new Uint8Array(result);

    return byteArray;
  }

  async getConsumableNotes(accountId: string, currentBlockHeight: number): Promise<ConsumableNoteRecord[]> {
    const result = await this.webClient.getConsumableNotes();
    const notes = result.filter(note => {
      const consumability = note.noteConsumability();
      if (consumability.length === 0) {
        return false;
      }
      if (consumability[0].accountId().toBech32(NetworkId.Devnet, AccountInterface.BasicWallet) !== accountId) {
        return false;
      }
      const consumableAfterBlock = consumability[0].consumableAfterBlock();
      if (consumableAfterBlock === undefined) {
        return true;
      }
      return consumableAfterBlock < currentBlockHeight;
    });

    return notes;
  }

  async sendTransaction(dbTransaction: SendTransaction) {
    const {
      accountId: senderAccountId,
      secondaryAccountId: recipientAccountId,
      faucetId,
      noteType,
      amount,
      extraInputs: { recallBlocks, delegateTransaction }
    } = dbTransaction;

    let recallHeight = undefined;
    if (recallBlocks) {
      const syncState = await this.syncState();
      const blockNum = syncState.blockNum();
      recallHeight = blockNum + recallBlocks;
    }

    let sendTransactionRequest = this.webClient.newSendTransactionRequest(
      accountIdStringToSdk(senderAccountId),
      accountIdStringToSdk(recipientAccountId),
      accountIdStringToSdk(faucetId),
      toNoteType(noteType),
      amount,
      recallHeight
    );
    let sendTransactionResult = await this.webClient.newTransaction(
      accountIdStringToSdk(senderAccountId),
      sendTransactionRequest
    );
    await this.submitTransactionWithFallback(sendTransactionResult, delegateTransaction);

    return sendTransactionResult;
  }

  async exportDb() {
    const dump = await this.webClient.exportStore();
    console.log('type of dump', typeof dump);
    return dump;
  }

  async importDb(dump: any) {
    await this.webClient.forceImportStore(dump);
  }

  async submitTransaction(
    accountId: string,
    transactionRequestBytes: Uint8Array,
    delegateTransaction?: boolean
  ): Promise<TransactionResult> {
    await this.syncState();
    const transactionRequest = TransactionRequest.deserialize(new Uint8Array(transactionRequestBytes));
    const transactionResult = await this.webClient.newTransaction(accountIdStringToSdk(accountId), transactionRequest);
    await this.submitTransactionWithFallback(transactionResult, delegateTransaction);
    return transactionResult;
  }

  async getTransactionsForAccount(accountId: string) {
    const transactions = await this.webClient.getTransactions(TransactionFilter.all());
    return transactions.filter(
      tx => tx.accountId().toBech32(NetworkId.Devnet, AccountInterface.BasicWallet) === accountId
    );
  }

  private async submitTransactionWithFallback(transactionResult: TransactionResult, delegateTransaction?: boolean) {
    try {
      if (delegateTransaction) {
        try {
          await this.webClient.submitTransaction(
            transactionResult,
            TransactionProver.newRemoteProver(MIDEN_PROVING_ENDPOINTS.get(this.network)!)
          );
        } catch (error) {
          console.log('Error submitting delegated transaction, falling back to local prover:', error);
          this.onConnectivityIssue?.();
          await this.webClient.submitTransaction(transactionResult, undefined);
        }
      } else {
        await this.webClient.submitTransaction(transactionResult, undefined);
      }
    } catch (error) {
      console.error('Error submitting transaction:', error);
    }
  }
}

export const accountIdStringToSdk = (accountId: string) => {
  return AccountId.fromBech32(accountId);
};
