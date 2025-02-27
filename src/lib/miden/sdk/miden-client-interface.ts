import {
  Account,
  AccountId,
  AccountStorageMode,
  ConsumableNoteRecord,
  TransactionFilter,
  TransactionRequest,
  WebClient
} from '@demox-labs/miden-sdk';
import { TransactionResult } from '@demox-labs/miden-sdk/dist/crates/miden_client_web';

import { MIDEN_NETWORK_ENDPOINTS, MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { toNoteType } from 'lib/miden/activity';
import { WalletType } from 'screens/onboarding/types';

import { ConsumeTransaction, SendTransaction } from '../db/types';
import { NoteExportType } from './constants';

export class MidenClientInterface {
  webClient: WebClient;
  private constructor(webClient: WebClient) {
    this.webClient = webClient;
  }

  static async create() {
    const webClient = await WebClient.create_client(MIDEN_NETWORK_ENDPOINTS.get(MIDEN_NETWORK_NAME.LOCALNET)!);

    return new MidenClientInterface(webClient);
  }

  async createMidenWallet(walletType: WalletType) {
    // Create a new wallet
    const accountStorageMode =
      walletType === WalletType.OnChain ? AccountStorageMode.public() : AccountStorageMode.private();
    const wallet: Account = await this.webClient.new_wallet(accountStorageMode, true);

    const walletId = wallet.id().to_string();

    console.log({ walletId });

    return walletId;
  }

  async importMidenWallet(accountBytes: Uint8Array): Promise<string> {
    console.log('Importing wallet...');
    console.log({ accountBytes });
    console.log({ accountBytesString: accountBytes.toString() });

    const wallet: Account = await this.webClient.import_account(accountBytes);
    const walletIdString = wallet.id().to_string();

    console.log({ walletId: wallet.id() });
    console.log({ walletIdString });

    return walletIdString;
  }

  async consumeTransaction(accountId: string, listOfNoteIds: string[]) {
    const result = await this.webClient.new_consume_transaction(accountIdStringToSdk(accountId), listOfNoteIds);
    return result;
  }

  async importNoteBytes(noteBytes: Uint8Array) {
    console.log('Importing note...');
    const result = await this.webClient.import_note(noteBytes);
    console.log('Imported note:', result);
    return result;
  }

  async consumeNoteId(transaction: ConsumeTransaction) {
    const { accountId, noteId } = transaction;

    await this.fetchCacheAccountAuth(accountId);

    const result = await this.webClient.new_consume_transaction(accountIdStringToSdk(accountId), [noteId]);

    return result;
  }

  async getAccount(accountId: string) {
    const result = await this.webClient.get_account(accountIdStringToSdk(accountId));
    return result;
  }

  async getAccounts() {
    const result = await this.webClient.get_accounts();
    return result;
  }

  async syncState() {
    return await this.webClient.sync_state();
  }

  async fetchCacheAccountAuth(accountId: string) {
    const result = await this.webClient.fetch_and_cache_account_auth_by_pub_key(accountIdStringToSdk(accountId));
    return result;
  }

  async exportNote(noteId: string, exportType: NoteExportType): Promise<Uint8Array> {
    const result = await this.webClient.export_note(noteId, exportType);
    const byteArray = new Uint8Array(result);

    return byteArray;
  }

  async getConsumableNotes(accountId: string, currentBlockHeight: number): Promise<ConsumableNoteRecord[]> {
    const result = await this.webClient.get_consumable_notes();
    const notes = result.filter(note => {
      const consumability = note.note_consumability();
      if (consumability.length === 0) {
        return false;
      }
      const consumableAfterBlock = note.note_consumability()[0].consumable_after_block();
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
      extraInputs: { recallBlocks }
    } = dbTransaction;

    let recallHeight = undefined;
    if (recallBlocks) {
      const syncState = await this.syncState();
      const blockNum = syncState.block_num();
      recallHeight = blockNum + recallBlocks;
    }

    await this.fetchCacheAccountAuth(senderAccountId);
    const result = await this.webClient.new_send_transaction(
      accountIdStringToSdk(senderAccountId),
      accountIdStringToSdk(recipientAccountId),
      accountIdStringToSdk(faucetId),
      toNoteType(noteType),
      amount,
      recallHeight
    );

    return result;
  }

  async submitTransaction(accountId: string, transactionRequestBytes: Uint8Array): Promise<TransactionResult> {
    await this.syncState();
    await this.fetchCacheAccountAuth(accountId);
    const transactionRequest = TransactionRequest.deserialize(new Uint8Array(transactionRequestBytes));
    const transactionResult = await this.webClient.new_transaction(accountIdStringToSdk(accountId), transactionRequest);
    await this.webClient.submit_transaction(transactionResult);
    return transactionResult;
  }

  async getTransactionsForAccount(accountId: string) {
    const transactions = await this.webClient.get_transactions(TransactionFilter.all());
    return transactions.filter(tx => tx.account_id().to_string() === accountId);
  }
}

export const accountIdStringToSdk = (accountId: string) => {
  return AccountId.from_hex(accountId);
};
