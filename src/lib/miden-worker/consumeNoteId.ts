import { spawn, Worker, Thread } from 'threads';

type ConsumeNoteIdWorker = (address: string, noteId: string) => Promise<void>;

export const consumeNoteId = async (address: string, noteId: string): Promise<void> => {
  const worker = await spawn<ConsumeNoteIdWorker>(new Worker('./consumeNoteId.js'));

  try {
    await worker(address, noteId);
    await Thread.terminate(worker);
  } catch (e) {
    await Thread.terminate(worker);
    throw e;
  }
};
