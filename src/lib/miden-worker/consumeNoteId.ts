import { spawn, Worker, Thread } from 'threads';

export type ConsumeNoteIdWorker = (address: string, noteId: string, delegateProof: boolean) => Promise<void>;

export const consumeNoteId = async (address: string, noteId: string, delegateProof: boolean): Promise<void> => {
  const worker = await spawn<ConsumeNoteIdWorker>(new Worker('./consumeNoteId.js'));

  try {
    await worker(address, noteId, delegateProof);
    await Thread.terminate(worker);
  } catch (e) {
    await Thread.terminate(worker);
    throw e;
  }
};
