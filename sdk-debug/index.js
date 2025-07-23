import { WebClient, AccountStorageMode, AccountId, NoteType, TransactionRequest } from './libs/dist/index.js';
console.log('script loaded');

const MIDEN_DECIMALS = 6;

const databases = await indexedDB.databases();
for (const db of databases) {
  // Delete each database by name
  indexedDB.deleteDatabase(db.name);
}

// Your rpc should automatically be configured to this port, but if not you can set it here
const webClient = await WebClient.createClient('http://localhost:57291');

console.log('creating faucet...');
const faucet = await webClient.newFaucet(
  AccountStorageMode.public(),
  false,
  'TEST',
  10,
  BigInt(1000000 * 10 ** MIDEN_DECIMALS)
);
const faucetId = faucet.id();
console.log('created faucet id:', faucetId.toBech32());

console.log('syncing state');
await webClient.syncState();
console.log('synced state');

document.getElementById('loading').style.display = 'none';
document.getElementById('faucetIdTitle').style.display = 'block';
document.getElementById('faucetId').innerText = faucetId.toBech32();

document.getElementById('publicKeyForm').addEventListener('submit', async event => {
  event.preventDefault();
  const accountIdString = document.getElementById('publicKey').value;
  const isPrivate = document.getElementById('isPrivate').checked;
  const amount = document.getElementById('amount').value;
  if (!accountIdString) {
    alert('Please enter a public key');
    return;
  }
  if (!amount || isNaN(amount)) {
    alert('Please enter a digit amount');
    return;
  }
  const accountId = AccountId.fromBech32(accountIdString);

  console.log('creating mint txn...');
  const mintTxnRequest = webClient.newMintTransactionRequest(
    accountId,
    faucetId,
    isPrivate ? NoteType.Private : NoteType.Public,
    BigInt(amount * 10 ** MIDEN_DECIMALS)
  );
  let mintTxnResult = await webClient.newTransaction(faucetId, mintTxnRequest);
  await webClient.submitTransaction(mintTxnResult);
  const noteId = mintTxnResult.createdNotes().notes()[0].id();
  console.log('created mint txn');

  if (isPrivate) {
    console.log('exporting note...');
    const result = await webClient.exportNote(noteId.toString(), 'Partial');
    const noteBytes = new Uint8Array(result);

    const blob = new Blob([noteBytes], { type: 'application/octet-stream' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exportNoteTest.mno'; // Specify the file name

    // Append the anchor to the document
    document.body.appendChild(a);

    // Programmatically click the anchor to trigger the download
    a.click();

    // Remove the anchor from the document
    document.body.removeChild(a);

    // Revoke the object URL to free up resources
    URL.revokeObjectURL(url);
  }

  await webClient.syncState();
  console.log('synced state complete');
});

document.getElementById('transactionRequestForm').addEventListener('submit', async event => {
  event.preventDefault();
  const accountIdString = document.getElementById('publicKey').value;
  if (!accountIdString) {
    alert('Please enter a public key');
    return;
  }
  const accountId = AccountId.fromBech32(accountIdString);

  console.log('creating transaction request...');
  const mintTransactionRequest = webClient.newMintTransactionRequest(
    accountId,
    faucetId,
    NoteType.Public,
    BigInt(100 * 10 ** MIDEN_DECIMALS)
  );
  console.log('created transaction request');
  console.log('exporting transaction request...');
  const bytes = mintTransactionRequest.serialize();

  const blob = new Blob([bytes], { type: 'application/octet-stream' });

  // Create a URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element
  const a = document.createElement('a');
  a.href = url;
  a.download = 'exportTxRequest.mno'; // Specify the file name

  // Append the anchor to the document
  document.body.appendChild(a);

  // Programmatically click the anchor to trigger the download
  a.click();

  // Remove the anchor from the document
  document.body.removeChild(a);

  // Revoke the object URL to free up resources
  URL.revokeObjectURL(url);

  await webClient.syncState();
  console.log('synced state complete');
});

document.getElementById('fileInput').addEventListener('change', async event => {
  event.preventDefault();
  const file = event.target.files ? event.target.files[0] : null;
  if (file) {
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        if (e.target?.result instanceof ArrayBuffer) {
          const txRequestAsUint8Array = new Uint8Array(e.target.result);
          const transactionRequest = TransactionRequest.deserialize(txRequestAsUint8Array);
          console.log('deserialized transaction request:', transactionRequest);
        }
      } catch (error) {
        console.error('Error during note import:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  }
});
