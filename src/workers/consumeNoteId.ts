import { expose } from 'threads/worker';

import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

async function consumeNoteId(address: string, noteId: string): Promise<void> {
  const midenClient = await MidenClientInterface.create();
  await midenClient.consumeNoteId(address, noteId);
}

expose(consumeNoteId);
