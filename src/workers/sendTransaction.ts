import { NoteType } from '@demox-labs/miden-sdk';
import { expose } from 'threads/worker';

import { ampApi } from 'lib/amp/amp-interface';
import { NoteExportType } from 'lib/miden/sdk/constants';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import { ExportedNote } from 'lib/miden/types';

async function sendTransaction(
  senderAccountId: string,
  recipientAccountId: string,
  faucetId: string,
  noteType: string,
  amount: string,
  recallBlocks?: number
): Promise<ExportedNote | null> {
  const midenClient = await MidenClientInterface.create();
  const noteTypeObj = noteType === 'public' ? NoteType.public() : NoteType.private();
  const result = await midenClient.sendTransaction(
    senderAccountId,
    recipientAccountId,
    faucetId,
    noteTypeObj,
    BigInt(amount),
    recallBlocks
  );

  if (noteType === 'private') {
    const noteId = result.created_notes().notes()[0].id().to_string();
    const noteBytes = await midenClient.exportNote(noteId, NoteExportType.PARTIAL);

    // TODO: Potentially unhook this from export process
    try {
      await ampApi.postMessage({
        recipient: recipientAccountId,
        body: noteBytes.toString()
      });
      console.log('Sent note to AMP');
    } catch (e) {
      console.error('Failed to send note to AMP', e);
    }

    return { noteId, noteBytes };
  }

  return null;
}

expose(sendTransaction);
