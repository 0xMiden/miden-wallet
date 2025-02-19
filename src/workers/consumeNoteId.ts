import { expose } from 'threads/worker';

import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

async function consumeNoteId(address: string, noteId: string, delegateProving: boolean): Promise<void> {
  const midenClient = await MidenClientInterface.create({ delegateProving });
  await midenClient.consumeNoteId(address, noteId);
}

expose(consumeNoteId);
