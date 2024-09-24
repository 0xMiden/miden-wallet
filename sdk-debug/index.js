import { WebClient } from './libs/dist/index.js';

console.log('script loaded');

const webClient = new WebClient();

// Your rpc should automatically be configured to this port, but if not you can set it here
await webClient.create_client('http://localhost:57291');

document.getElementById('publicKeyForm').addEventListener('submit', async event => {
  event.preventDefault();
  const accountId = document.getElementById('publicKey').value;
  console.log('public key:', accountId);
  if (!accountId) {
    alert('Please enter a public key');
    return;
  }

  console.log('creating faucet...');
  const faucet = await webClient.new_faucet('Private', false, 'TEST', '10', '1000000');
  const faucetId = faucet.to_string();
  console.log('created faucet:', faucetId);

  console.log('syncing state');
  await webClient.sync_state(true);
  console.log('synced state');

  console.log('fetching account auth...');
  await webClient.fetch_and_cache_account_auth_by_pub_key(faucetId);
  console.log('fetched account auth');

  console.log('creating mint txn...');
  const mintTxn = await webClient.new_mint_transaction(accountId, faucetId, 'Private', '100');
  const noteId = mintTxn.created_note_ids[0];
  console.log('created mint txn');

  console.log('exporting note...');
  const result = await webClient.export_note(noteId, 'Partial');
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

  await webClient.sync_state();
  console.log('synced state complete');
});
