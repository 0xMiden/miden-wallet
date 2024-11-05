import { expose } from 'threads/worker';

import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

async function consumeNoteId(address: string, noteId: string, delegateProof = false): Promise<void> {
  const midenClient = await MidenClientInterface.create(delegateProof);
  await midenClient.consumeNoteId(address, noteId);
}

expose(consumeNoteId);
