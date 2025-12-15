import { useCallback } from 'react';

import { getUncompletedTransactions } from 'lib/miden/activity';
import { useRetryableSWR } from 'lib/swr';

import { isMidenFaucet } from '../assets';
import { AssetMetadata, MIDEN_METADATA } from '../metadata';
import { getBech32AddressFromAccountId } from '../sdk/helpers';
import { getMidenClient } from '../sdk/miden-client';
import { MidenClientCreateOptions } from '../sdk/miden-client-interface';
import { ConsumableNote } from '../types';
import { useTokensMetadata } from './assets';
import { useMidenContext } from './client';

// -------------------- Types --------------------

type ParsedNote = {
  id: string;
  faucetId: string;
  amountBaseUnits: string;
  senderAddress: string;
  isBeingClaimed: boolean;
};

// -------------------- Pure helpers (no side effects) --------------------

function parseNotes(rawNotes: any[], notesBeingClaimed: Set<string>): ParsedNote[] {
  const parsed: ParsedNote[] = [];

  for (const note of rawNotes) {
    try {
      const noteRecord = note.inputNoteRecord();
      const noteId = noteRecord.id().toString();
      const noteMeta = noteRecord.metadata();
      const details = noteRecord.details();

      const assetSet = details.assets();
      const fungibleAssets = assetSet.fungibleAssets();

      // Safety checks
      if (!fungibleAssets || fungibleAssets.length === 0) continue;

      const firstAsset = fungibleAssets[0];
      if (!firstAsset) continue;

      const faucetId = getBech32AddressFromAccountId(firstAsset.faucetId());
      const amountBaseUnits = firstAsset.amount().toString();
      const senderAddress = noteMeta ? getBech32AddressFromAccountId(noteMeta.sender()) : '';

      parsed.push({
        id: noteId,
        faucetId,
        amountBaseUnits,
        senderAddress,
        isBeingClaimed: notesBeingClaimed.has(noteId)
      });
    } catch (err) {
      console.error('Error processing note:', err);
    }
  }

  return parsed;
}

async function buildMetadataMapFromCache(
  notes: ParsedNote[],
  cache: Record<string, AssetMetadata> | undefined
): Promise<Record<string, AssetMetadata>> {
  const map: Record<string, AssetMetadata> = {};
  for (const n of notes) {
    if (await isMidenFaucet(n.faucetId)) {
      map[n.faucetId] = MIDEN_METADATA;
    } else {
      const cached = cache?.[n.faucetId];
      if (cached) map[n.faucetId] = cached;
    }
  }
  return map;
}

async function findMissingFaucetIds(
  notes: ParsedNote[],
  metadataByFaucetId: Record<string, AssetMetadata>
): Promise<string[]> {
  const missing = new Set<string>();
  for (const n of notes) {
    const isMiden = await isMidenFaucet(n.faucetId);
    if (!isMiden && !metadataByFaucetId[n.faucetId]) {
      missing.add(n.faucetId);
    }
  }
  return Array.from(missing);
}

function attachMetadataToNotes(
  notes: ParsedNote[],
  metadataByFaucetId: Record<string, AssetMetadata>
): Array<ConsumableNote & { metadata: AssetMetadata }> {
  return notes.map(n => ({
    id: n.id,
    faucetId: n.faucetId,
    amount: n.amountBaseUnits, // base units
    metadata: metadataByFaucetId[n.faucetId]!, // guaranteed present by caller
    senderAddress: n.senderAddress,
    isBeingClaimed: n.isBeingClaimed
  }));
}

// -------------------- Side-effect helpers --------------------

async function fetchMetadataBatch(
  faucetIds: string[],
  fetchMetadata: (id: string) => Promise<{ base: AssetMetadata }>
): Promise<Record<string, AssetMetadata>> {
  const result: Record<string, AssetMetadata> = {};

  await Promise.all(
    faucetIds.map(async id => {
      try {
        const { base } = await fetchMetadata(id);
        result[id] = base; // write successes directly
      } catch (e) {
        console.warn('Metadata fetch failed for', id, e);
      }
    })
  );

  return result;
}

async function persistMetadataIfAny(
  toPersist: Record<string, AssetMetadata>,
  setTokensBaseMetadata: (batch: Record<string, AssetMetadata>) => Promise<void>
): Promise<void> {
  if (Object.keys(toPersist).length > 0) {
    await setTokensBaseMetadata(toPersist);
  }
}

// -------------------- Hook (composes helpers) --------------------

export function useClaimableNotes(publicAddress: string, enabled: boolean = true) {
  const { allTokensBaseMetadataRef, fetchMetadata, setTokensBaseMetadata } = useTokensMetadata();
  const { getAuthSecretKey, signTransaction } = useMidenContext();

  const fetchClaimableNotes = useCallback(async () => {
    const options: MidenClientCreateOptions = {
      getKeyCallback: async (key: Uint8Array) => {
        console.log('getKeyCallback', key);
        const keyString = Buffer.from(key).toString('hex');
        const secretKey = await getAuthSecretKey(keyString);
        return new Uint8Array(Buffer.from(secretKey, 'hex'));
      },
      signCallback: async (publicKey: Uint8Array, signingInputs: Uint8Array) => {
        console.log('signCallback', publicKey, signingInputs);
        const keyString = Buffer.from(publicKey).toString('hex');
        const signingInputsString = Buffer.from(signingInputs).toString('hex');
        const result = await signTransaction(keyString, signingInputsString);
        return result;
      }
    };
    const midenClient = await getMidenClient(options);
    const syncSummary = await midenClient.syncState();
    const latestBlock = syncSummary.blockNum();

    const [rawNotes, uncompletedTxs] = await Promise.all([
      midenClient.getConsumableNotes(publicAddress, latestBlock),
      getUncompletedTransactions(publicAddress)
    ]);
    const notesBeingClaimed = new Set(
      uncompletedTxs.filter(tx => tx.type === 'consume' && tx.noteId != null).map(tx => tx.noteId!)
    );
    // 1) Parse notes and collect faucet ids
    const parsedNotes = parseNotes(rawNotes, notesBeingClaimed);
    // 2) Seed metadata map from cache (and baked-in MIDEN)
    const metadataByFaucetId = await buildMetadataMapFromCache(parsedNotes, allTokensBaseMetadataRef.current);

    // 3) Fetch any missing metadata now (blocking), then persist once
    const missingFaucetIds = await findMissingFaucetIds(parsedNotes, metadataByFaucetId);
    if (missingFaucetIds.length > 0) {
      const fetched = await fetchMetadataBatch(missingFaucetIds, fetchMetadata);
      Object.assign(metadataByFaucetId, fetched);
      await persistMetadataIfAny(fetched, setTokensBaseMetadata);
    }

    // 4) Return notes enriched with metadata
    return attachMetadataToNotes(parsedNotes, metadataByFaucetId);
  }, [
    publicAddress,
    allTokensBaseMetadataRef,
    fetchMetadata,
    setTokensBaseMetadata,
    getAuthSecretKey,
    signTransaction
  ]);

  const key = enabled ? ['claimable-notes', publicAddress] : null;
  return useRetryableSWR(key, enabled ? fetchClaimableNotes : null, {
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
    refreshInterval: 5_000,
    onError: e => console.error('Error fetching claimable notes:', e)
  });
}
