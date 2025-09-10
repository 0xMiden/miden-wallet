import { useCallback } from 'react';

import { AccountInterface, NetworkId } from '@demox-labs/miden-sdk';

import { getUncompletedTransactions } from 'lib/miden/activity';
import { useRetryableSWR } from 'lib/swr';

import { MidenClientInterface } from '../sdk/miden-client-interface';
import { ConsumableNote } from '../types';

export function useClaimableNotes(publicAddress: string) {
  const fetchClaimableNotes = useCallback(async () => {
    const midenClient = await MidenClientInterface.create();
    const syncSummary = await midenClient.syncState();
    const b = syncSummary.blockNum();
    const notes = await midenClient.getConsumableNotes(publicAddress, b);
    const uncompletedTransactions = await getUncompletedTransactions(publicAddress);
    const notesBeingClaimed = new Set(
      uncompletedTransactions.filter(tx => tx.type === 'consume' && tx.noteId != null).map(tx => tx.noteId!)
    );

    const processedNotes = notes
      .map(note => {
        try {
          const inputNoteRecord = note.inputNoteRecord();
          const noteId = inputNoteRecord.id().toString();
          const metadata = inputNoteRecord.metadata();
          const details = inputNoteRecord.details();
          const noteAssets = details.assets();
          const assets = noteAssets.fungibleAssets();

          // Check if there are any assets
          if (!assets || assets.length === 0) {
            return null;
          }

          const asset = assets[0];
          if (!asset) {
            return null;
          }

          return {
            id: noteId,
            faucetId: asset.faucetId().toBech32(NetworkId.Testnet, AccountInterface.BasicWallet),
            amount: asset.amount().toString(),
            senderAddress: metadata?.sender()?.toBech32(NetworkId.Testnet, AccountInterface.BasicWallet) || '',
            isBeingClaimed: notesBeingClaimed.has(noteId)
          } as ConsumableNote;
        } catch (error) {
          console.error('Error processing note:', error);
          return null;
        }
      })
      .filter(note => note !== null);

    return processedNotes;
  }, [publicAddress]);

  return useRetryableSWR(publicAddress, fetchClaimableNotes, {
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
    refreshInterval: 5_000,
    onError: error => {
      console.error('Error fetching claimable notes:', error);
    }
  });
}
