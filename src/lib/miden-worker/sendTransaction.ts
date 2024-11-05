import { spawn, Worker, Thread } from 'threads';

export type SendTransactionWorker = (
  senderAccountId: string,
  recipientAccountId: string,
  faucetId: string,
  noteType: string,
  amount: string,
  recallBlocks?: number
) => Promise<void>;

export const sendTransaction = async (
  senderAccountId: string,
  recipientAccountId: string,
  faucetId: string,
  noteType: string,
  amount: string,
  recallBlocks?: number
): Promise<void> => {
  const worker = await spawn<SendTransactionWorker>(new Worker('./sendTransaction.js'));

  try {
    await worker(senderAccountId, recipientAccountId, faucetId, noteType, amount, recallBlocks);
    await Thread.terminate(worker);
  } catch (e) {
    await Thread.terminate(worker);
    throw e;
  }
};
