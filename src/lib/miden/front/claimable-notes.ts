import { useCallback } from 'react';

import { useRetryableSWR } from 'lib/swr';

import { MidenClientInterface } from '../sdk/miden-client-interface';

const midenClient = await MidenClientInterface.create();

export function useClaimableNotes(publicAddress: string) {
  const fetchClaimableNotes = useCallback(async () => {
    const syncSummary = await midenClient.syncState();
    const b = syncSummary.block_num();
    const notes = await midenClient.getConsumableNotes(publicAddress, b);
    return notes.map(note => {
      const senderId = note.input_note_record().metadata()?.sender();
      const senderAddress = senderId ? senderId.to_string() : '';
      return {
        id: note.input_note_record().id().to_string(),
        amount: note.input_note_record().details().assets().assets()[0].amount().toString(),
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
