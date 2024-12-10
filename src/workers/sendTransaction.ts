import { NoteType } from '@demox-labs/miden-sdk';
import { expose } from 'threads/worker';

import { NoteExportType } from 'lib/miden/sdk/constants';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import { ExportedNote } from 'lib/miden/types';

async function sendTransaction(
  senderAccountId: string,
  recipientAccountId: string,
  faucetId: string,
  noteType: string,
  amount: string,
  recallBlocks?: number,
  delegateProof?: boolean
): Promise<ExportedNote | null> {
  const midenClient = await MidenClientInterface.create(delegateProof);
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
    console.log('Exporting note:', noteId);
    const noteBytes = await midenClient.exportNote(noteId, NoteExportType.PARTIAL);
    return { noteId, noteBytes };
  }

  return null;
}

expose(sendTransaction);
