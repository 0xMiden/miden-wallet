import { Account, AccountId, AccountStorageMode, WebClient } from '@demox-labs/miden-sdk';
import { MidenWalletStorageType, NoteExportType } from './constants';

const webClient = new WebClient();

// TODO: Refactor this, pull out to const / figure out what to point correctly at rather than a machine

try {
  console.log('Creating client...');
  // await webClient.create_client('http://18.203.155.106:57291');
  await webClient.create_client('http://localhost:57291');
} catch (e) {
  console.error('Error creating client:', e);
}

export const createMidenWallet = async () => {
  // Create a new wallet
  console.log('Creating wallet...');
  const wallet: Account = await webClient.new_wallet(AccountStorageMode.private(), true);

  const walletId = wallet.id().to_string();

  console.log({ walletId });

  return walletId;
};

export const importMidenWallet = async (accountBytes: Uint8Array): Promise<string> => {
  console.log('Importing wallet...');
  console.log({ accountBytes });
  console.log({ accountBytesString: accountBytes.toString() });

  const wallet: Account = await webClient.import_account(accountBytes);
  const walletIdString = wallet.id().to_string();

  console.log({ walletId: wallet.id() });
  console.log({ walletIdString });

  return walletIdString;
};

export const consumeTransaction = async (accountId: string, listOfNotes: string[]) => {
  const result = await webClient.new_consume_transaction(accountIdStringToSdk(accountId), listOfNotes);
};

export const importNote = async (noteBytes: Uint8Array) => {
  console.log('Importing note...');
  const result = await webClient.import_note(noteBytes);
  console.log('Imported note:', result);
  return result;
};

export const consumeNote = async (accountId: string, noteBytes: Uint8Array) => {
  await syncState();
  const noteId = await importNote(noteBytes);

  await fetchCacheAccountAuth(accountId);

  await syncState();

  console.log('Consuming note:', noteId);
  const result = await webClient.new_consume_transaction(accountIdStringToSdk(accountId), [noteId]);
  console.log('Consumed note:', result);

  return result;
};

// export const listNotes = async () => {
//   const notes = await webClient.get_input_notes('All');
//   console.log('Notes:', notes);

//   return notes;
// };

export const getAccount = async (accountId: string) => {
  console.log('Getting account:', accountId);
  const result = await webClient.get_account(accountIdStringToSdk(accountId));
  console.log('Account:', result);
  return result;
};

export const getTokens = async (accountId: string, amount: number) => {};

export const createFaucet = async () => {
  console.log('Creating faucet...');
  const faucet: Account = await webClient.new_faucet(AccountStorageMode.private(), false, 'TEST', 10, BigInt(1000000));
  const faucetId = faucet.id().to_string();
  console.log({ faucetId });
  return faucetId;
};

export const syncState = async () => {
  const result = await webClient.sync_state();
  console.log({ result });
  return result;
};

export const fetchCacheAccountAuth = async (accountId: string) => {
  console.log('Fetching account auth:', accountId);
  let result;
  try {
    result = await webClient.fetch_and_cache_account_auth_by_pub_key(accountIdStringToSdk(accountId));
  } catch (e) {
    console.error(`Unable to get auth for accountId: ${accountId}. Verify that this account is yours`, e);
  }

  console.log('Account auth fetched');
  return result;
};

export const createNewMintTransaction = async (
  targetAccountId: string,
  faucetId: string,
  storageType: AccountStorageMode,
  amount: bigint
) => {
  console.log('Creating new mint transaction...');
  console.log({ targetAccountId, faucetId, storageType, amount });
  const result = await webClient.new_mint_transaction(
    accountIdStringToSdk(targetAccountId),
    accountIdStringToSdk(faucetId),
    storageType,
    amount
  );
  return result;
};

export const exportNote = async (noteId: string, exportType: NoteExportType) => {
  const result = await webClient.export_note(noteId, exportType);
  const byteArray = new Uint8Array(result);

  return byteArray;
};

export const accountIdStringToSdk = (accountId: string) => AccountId.from_hex(accountId);
