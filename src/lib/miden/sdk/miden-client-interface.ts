import {
  Account,
  AccountId,
  AccountStorageMode,
  NoteFilter,
  NoteFilterTypes,
  NoteType,
  WebClient
} from '@demox-labs/miden-sdk';

import { MIDEN_NETWORK_ENDPOINTS, MIDEN_NETWORK_NAME, MIDEN_PROVING_ENDPOINTS } from 'lib/miden-chain/constants';

import { NoteExportType } from './constants';
import { InputNoteRecord } from '@demox-labs/miden-sdk/dist/crates/miden_client_web';

export class MidenClientInterface {
  webClient: WebClient;
  private constructor(webClient: WebClient) {
    this.webClient = webClient;
  }

  static async create(delegateProving: boolean = false) {
    const webClient = new WebClient();

    if (delegateProving) {
      await webClient.create_client(
        MIDEN_NETWORK_ENDPOINTS.get(MIDEN_NETWORK_NAME.LOCALNET)!,
        MIDEN_PROVING_ENDPOINTS.get(MIDEN_NETWORK_NAME.LOCALNET)!
      );
    } else {
      await webClient.create_client(MIDEN_NETWORK_ENDPOINTS.get(MIDEN_NETWORK_NAME.LOCALNET)!);
    }

    return new MidenClientInterface(webClient);
  }

  async createMidenWallet() {
    // Create a new wallet
    console.log('Creating wallet...');
    const wallet: Account = await this.webClient.new_wallet(AccountStorageMode.public(), true);

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

  async consumeNoteId(accountId: string, noteId: string) {
    await this.fetchCacheAccountAuth(accountId);

    console.log('Consuming note:', noteId);
    const result = await this.webClient.new_consume_transaction(accountIdStringToSdk(accountId), [noteId]);
    console.log('Consumed note:', result);

    return result;
  }

  async consumeNoteBytes(accountId: string, noteBytes: Uint8Array) {
    await this.syncState();
    const noteId = await this.importNoteBytes(noteBytes);

    await this.fetchCacheAccountAuth(accountId);

    await this.syncState();

    console.log('Consuming note:', noteId);
    const result = await this.webClient.new_consume_transaction(accountIdStringToSdk(accountId), [noteId]);
    console.log('Consumed note:', result);

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
    const syncSummary = await this.webClient.sync_state();
    // console.log('blockNum: ', syncSummary.block_num());
    // console.log('comitted notes: ', syncSummary.committed_notes());
    // console.log('committed_transactions: ', syncSummary.committed_transactions());
    // console.log('consumed_notes: ', syncSummary.consumed_notes());
    // console.log('received_notes: ', syncSummary.received_notes());
    // console.log('updated_accounts: ', syncSummary.updated_accounts());

    return syncSummary;
  }

  async fetchCacheAccountAuth(accountId: string) {
    const result = await this.webClient.fetch_and_cache_account_auth_by_pub_key(accountIdStringToSdk(accountId));
    return result;
  }

  async exportNote(noteId: string, exportType: NoteExportType) {
    const result = await this.webClient.export_note(noteId, exportType);
    const byteArray = new Uint8Array(result);

    return byteArray;
  }

  async getCommittedNotes(): Promise<InputNoteRecord[]> {
    const filter = new NoteFilter(NoteFilterTypes.Committed);
    const result = await this.webClient.get_input_notes(filter);

    return result;
  }

  async sendTransaction(
    senderAccountId: string,
    recipientAccountId: string,
    faucetId: string,
    noteType: NoteType,
    amount: bigint,
    recallBlocks?: number
  ) {
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
      noteType,
      amount,
      recallHeight
    );
    console.log(
      'Created notes:',
      result
        .created_notes()
        .notes()
        .map(note => note.id().to_string())
    );

    return result;
  }
}

export const accountIdStringToSdk = (accountId: string) => {
  return AccountId.from_hex(accountId);
};
