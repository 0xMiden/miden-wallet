import { useCallback } from 'react';

import { useRetryableSWR } from 'lib/swr';

import { MidenClientInterface } from '../sdk/miden-client-interface';

const midenClient = await MidenClientInterface.create();

export function useClaimableNotes(publicAddress: string) {
  const fetchClaimableNotes = useCallback(async () => {
    const syncSummary = await midenClient.syncState();
    const b = syncSummary.blockNum();
    const notes = await midenClient.getConsumableNotes(publicAddress, b);
    return notes.map(note => {
      const senderId = note.inputNoteRecord().metadata()?.sender();
      const senderAddress = senderId ? senderId.toString() : '';
      return {
        id: note.inputNoteRecord().id().toString(),
        amount: note.inputNoteRecord().details().assets().fungibleAssets()[0].amount().toString(),
        senderAddress: senderAddress
      };
    });
  }, [publicAddress]);

  return useRetryableSWR(publicAddress, fetchClaimableNotes, {
    revalidateOnFocus: false,
    dedupingInterval: 20_000,
    refreshInterval: 15_000
  });
}
