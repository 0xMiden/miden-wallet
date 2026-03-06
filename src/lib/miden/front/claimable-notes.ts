import { useCallback, useMemo } from 'react';

import { useNotes } from '@miden-sdk/react';

import { getUncompletedTransactions } from 'lib/miden/activity';
import { EMPTY_ASSET_METADATA } from 'lib/miden/metadata';
import { useRetryableSWR } from 'lib/swr';

import { AssetMetadata } from '../metadata';
import { ConsumableNote } from '../types';

/**
 * Hook that returns consumable notes with metadata, using the SDK's useNotes() hook.
 *
 * The SDK's useNotes() auto-refetches after each sync, replacing the old SWR + withWasmClientLock approach.
 * Asset metadata (symbol, decimals) is resolved by the SDK's internal useAssetMetadata hook.
 *
 * The isBeingClaimed flag is still derived from Dexie uncompleted transactions.
 */
export function useClaimableNotes(publicAddress: string, enabled: boolean = true) {
  const { consumableNoteSummaries, refetch, isLoading } = useNotes(enabled ? { accountId: publicAddress } : undefined);

  // Poll Dexie for uncompleted consume transactions to determine isBeingClaimed
  const { data: notesBeingClaimed, mutate: refetchClaimed } = useRetryableSWR(
    enabled ? ['notes-being-claimed', publicAddress] : null,
    async () => {
      const uncompletedTxs = await getUncompletedTransactions(publicAddress);
      return new Set(uncompletedTxs.filter(tx => tx.type === 'consume' && tx.noteId != null).map(tx => tx.noteId!));
    },
    { refreshInterval: 5_000, dedupingInterval: 5_000 }
  );

  const claimableNotes = useMemo(() => {
    if (!consumableNoteSummaries || consumableNoteSummaries.length === 0) return [];

    const claimedSet = notesBeingClaimed ?? new Set<string>();

    return consumableNoteSummaries
      .map(summary => {
        const firstAsset = summary.assets[0];
        if (!firstAsset) return null;

        const metadata: AssetMetadata = firstAsset.symbol
          ? {
              symbol: firstAsset.symbol,
              decimals: firstAsset.decimals ?? 0,
              name: firstAsset.symbol
            }
          : EMPTY_ASSET_METADATA;

        return {
          id: summary.id,
          faucetId: firstAsset.assetId,
          amount: firstAsset.amount.toString(),
          metadata,
          senderAddress: summary.sender ?? '',
          isBeingClaimed: claimedSet.has(summary.id)
        } satisfies ConsumableNote & { metadata: AssetMetadata };
      })
      .filter((n): n is NonNullable<typeof n> => n != null);
  }, [consumableNoteSummaries, notesBeingClaimed]);

  // Trigger SDK refetch + claimed status refresh
  const mutate = useCallback(async () => {
    await Promise.all([refetch(), refetchClaimed()]);
  }, [refetch, refetchClaimed]);

  return {
    data: enabled ? claimableNotes : undefined,
    mutate,
    isLoading,
    isValidating: isLoading
  };
}
