import {
  Account,
  AccountId,
  AccountStorageMode,
  ConsumableNoteRecord,
  NoteType,
  WebClient
} from '@demox-labs/miden-sdk';

import { MIDEN_NETWORK_ENDPOINTS, MIDEN_NETWORK_NAME, MIDEN_PROVING_ENDPOINTS } from 'lib/miden-chain/constants';
import { WalletType } from 'screens/onboarding/types';

import { NoteExportType } from './constants';
import { TransactionRequest, TransactionResult } from '@demox-labs/miden-sdk/dist/crates/miden_client_web';

export type MidenClientCreateOptions = {
  seed?: Uint8Array;
};

export class MidenClientInterface {
  webClient: WebClient;
  private constructor(webClient: WebClient) {
    this.webClient = webClient;
  }

  static async create(options: MidenClientCreateOptions = {}) {
    const seed = options.seed?.toString();
    const webClient = await WebClient.createClient(MIDEN_NETWORK_ENDPOINTS.get(MIDEN_NETWORK_NAME.LOCALNET)!, seed);

    return new MidenClientInterface(webClient);
  }

  async createMidenWallet(walletType: WalletType, seed?: Uint8Array): Promise<string> {
    // Create a new wallet
    const accountStorageMode =
      walletType === WalletType.OnChain ? AccountStorageMode.public() : AccountStorageMode.private();

    const wallet: Account = await this.webClient.newWallet(accountStorageMode, true, seed);
    const walletId = wallet.id().toString();

    return walletId;
  }

  async importMidenWallet(accountBytes: Uint8Array): Promise<string> {
    const wallet: Account = await this.webClient.importAccount(accountBytes);
    const walletIdString = wallet.id().toString();

    return walletIdString;
  }

  async importPublicMidenWalletFromSeed(seed: Uint8Array) {
    const account = await this.webClient.importPublicAccountFromSeed(seed, true);

    return account.id().toString();
  }

  async consumeTransaction(accountId: string, listOfNoteIds: string[]) {
    const result = await this.webClient.newConsumeTransaction(accountIdStringToSdk(accountId), listOfNoteIds);
    return result;
  }

  async importNoteBytes(noteBytes: Uint8Array) {
    console.log('Importing note...');
    const result = await this.webClient.importNote(noteBytes);
    console.log('Imported note:', result);
    return result;
  }

  async consumeNoteId(accountId: string, noteId: string) {
    await this.fetchCacheAccountAuth(accountId);

    console.log('Consuming note:', noteId);
    const result = await this.webClient.newConsumeTransaction(accountIdStringToSdk(accountId), [noteId]);
    console.log('Consumed note:', result);

    return result;
  }

  async consumeNoteBytes(accountId: string, noteBytes: Uint8Array) {
    await this.syncState();
    const noteId = await this.importNoteBytes(noteBytes);

    await this.fetchCacheAccountAuth(accountId);

    await this.syncState();

    console.log('Consuming note:', noteId);
    const result = await this.webClient.newConsumeTransaction(accountIdStringToSdk(accountId), [noteId]);
    console.log('Consumed note:', result);

    return result;
  }

  async getAccount(accountId: string) {
    const result = await this.webClient.getAccount(accountIdStringToSdk(accountId));
    return result;
  }

  async getAccounts() {
    const result = await this.webClient.getAccounts();
    return result;
  }

  async syncState() {
    const syncSummary = await this.webClient.syncState();
    console.log('blockNum: ', syncSummary.blockNum());
    console.log('comitted notes: ', syncSummary.committedNotes());
    console.log('committed_transactions: ', syncSummary.committedTransactions());
    console.log('consumed_notes: ', syncSummary.consumedNotes());
    console.log('received_notes: ', syncSummary.receivedNotes());
    console.log('updated_accounts: ', syncSummary.updatedAccounts());

    return syncSummary;
  }

  async fetchCacheAccountAuth(accountId: string) {
    const result = await this.webClient.fetchAndCacheAccountAuthByAccountId(accountIdStringToSdk(accountId));
    return result;
  }

  async exportNote(noteId: string, exportType: NoteExportType): Promise<Uint8Array> {
    const result = await this.webClient.exportNote(noteId, exportType);
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
      const consumableAfterBlock = note.noteConsumability()[0].consumableAfterBlock();
      if (consumableAfterBlock === undefined) {
        return true;
      }
      return consumableAfterBlock < currentBlockHeight;
    });

    return notes;
  }

  async mintTransaction(
    recipientAccountId: string,
    faucetId: string,
    noteType: NoteType,
    amount: bigint
  ): Promise<TransactionResult> {
    await this.fetchCacheAccountAuth(recipientAccountId);

    const result = await this.webClient.newMintTransaction(
      accountIdStringToSdk(recipientAccountId),
      accountIdStringToSdk(faucetId),
      noteType,
      amount
    );

    console.log(
      'Created notes:',
      result
        .createdNotes()
        .notes()
        .map(note => note.id().toString())
    );

    return result;
  }

  async sendTransaction(
    senderAccountId: string,
    recipientAccountId: string,
    faucetId: string,
    noteType: NoteType,
    amount: bigint,
    recallBlocks?: number
  ): Promise<TransactionResult> {
    let recallHeight = undefined;
    if (recallBlocks) {
      const syncState = await this.syncState();
      const blockNum = syncState.blockNum();
      recallHeight = blockNum + recallBlocks;
    }

    await this.fetchCacheAccountAuth(senderAccountId);

    const result = await this.webClient.newSendTransaction(
      accountIdStringToSdk(senderAccountId),
      accountIdStringToSdk(recipientAccountId),
      accountIdStringToSdk(faucetId),
      noteType,
      amount,
      recallHeight
    );
    console.log(
      'Created notes:',
      result
        .createdNotes()
        .notes()
        .map(note => note.id().toString())
    );

    return result;
  }

  async submitTransaction(accountId: string, transactionRequestBytes: Uint8Array) {
    await this.syncState();
    await this.fetchCacheAccountAuth(accountId);
    // const transactionRequest = TransactionRequest.deserialize(new Uint8Array(transactionRequestBytes));
    // const transactionResult = await this.webClient.new_transaction(accountIdStringToSdk(accountId), transactionRequest);
    // await this.webClient.submit_transaction(transactionResult);
    return '';
  }

  async exportDb() {
    const dump = await this.webClient.exportStore();
    console.log('type of dump', typeof dump);
    return dump;
  }

  async importDb(dump: any) {
    await this.webClient.forceImportStore(dump);
  }
}

export const accountIdStringToSdk = (accountId: string) => {
  return AccountId.fromHex(accountId);
};
