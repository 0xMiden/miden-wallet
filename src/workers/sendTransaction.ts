import { NoteType } from '@demox-labs/miden-sdk';
import { expose } from 'threads/worker';

import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

async function sendTransaction(
  senderAccountId: string,
  recipientAccountId: string,
  faucetId: string,
  noteType: string,
  amount: string,
  recallBlocks?: number,
  delegateProof = true
): Promise<void> {
  const midenClient = await MidenClientInterface.create(delegateProof);
  const noteTypeObj = noteType === 'public' ? NoteType.public() : NoteType.private();
  await midenClient.sendTransaction(
    senderAccountId,
    recipientAccountId,
    faucetId,
    noteTypeObj,
    BigInt(amount),
    recallBlocks
  );
}

expose(sendTransaction);
