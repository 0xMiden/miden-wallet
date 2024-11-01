import { useCallback } from 'react';

import { useRetryableSWR } from 'lib/swr';

import { MidenClientInterface } from '../sdk/miden-client-interface';

const midenClient = await MidenClientInterface.create();

export function useClaimableNotes(accountId: string) {
  const fetchClaimableNotes = useCallback(async () => {
    const notes = await midenClient.getCommittedNotes();
    return notes.map(note => ({
      id: note.id().to_string(),
      amount: note.details().assets().assets()[0].amount().toString()
    }));
  }, []);

  return useRetryableSWR(accountId, fetchClaimableNotes, {
    revalidateOnFocus: false,
    dedupingInterval: 20_000,
    refreshInterval: 15_000
  });
}
