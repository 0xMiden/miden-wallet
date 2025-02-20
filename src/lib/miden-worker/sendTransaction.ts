import { spawn, Thread, Worker } from 'threads';

import { ExportedNote } from 'lib/miden/types';

export type SendTransactionWorker = (
  senderAccountId: string,
  recipientAccountId: string,
  faucetId: string,
  noteType: string,
  amount: string,
  recallBlocks?: number
) => Promise<ExportedNote | null>;

export const sendTransaction = async (
  senderAccountId: string,
  recipientAccountId: string,
  faucetId: string,
  noteType: string,
  amount: string,
  recallBlocks?: number
): Promise<ExportedNote | null> => {
  const worker = await spawn<SendTransactionWorker>(new Worker('./sendTransaction.js'));

  try {
    const exportedNote = await worker(senderAccountId, recipientAccountId, faucetId, noteType, amount, recallBlocks);
    await Thread.terminate(worker);
    return exportedNote;
  } catch (e) {
    await Thread.terminate(worker);
    throw e;
  }
};
