import { getSerialNumbers, getRecordsByTransitionAndIndex, getProgram, getRecordMetadata } from 'lib/miden-chain';
import { IRecordMetadata } from 'lib/miden-chain/rpc-types';
import { scanRecordsDirect } from 'lib/miden-worker/scanRecordsDirect';
import { scanRecordsGpu } from 'lib/miden-worker/scanRecordsGpu';
import { Keys } from 'lib/miden/front/autoSync';
import * as Repo from 'lib/miden/repo';
import {
  MIN_RECORDS_FOR_PERFORMANCE_ANALYTICS,
  sendScanPerformanceEvent,
  setLastPerformanceSent
} from 'lib/analytics/performance-analytics';
import { logger } from 'shared/logger';

import { IRecord } from '../db/types';
import { createRecordSyncPlan, combineAdjacentCompleteRecordSyncs } from './sync/sync-plan';
import { SyncOptions } from './sync/sync-options';

export async function syncOwnedRecords(
  syncOptions: SyncOptions,
  keys: Keys[],
  currentRecordId: number,
  syncBatch: number,
  batchSize: number
) {
  const addressToKeysMap = {} as Map<string, Keys>;
  const addresses = Array.from(addressToKeysMap.keys());

  let allRecordSyncSteps = await createRecordSyncPlan(addresses, currentRecordId, batchSize);
  // sort reverse order -- the more recent blocks should be synced first
  allRecordSyncSteps.sort((rss1, rss2) => rss2.end - rss1.end);

  let stepsToSync = allRecordSyncSteps.length > syncBatch ? allRecordSyncSteps.slice(0, syncBatch) : allRecordSyncSteps;

  for (let syncStep of stepsToSync) {
    let matchingPKMap = getSubsetByValues(addressToKeysMap, syncStep.addressesToCheck);
    await doOwnedSync(syncOptions, syncStep.start, syncStep.end, matchingPKMap);
  }
}

export function getSubsetByValues(addressesToKeys: Map<string, Keys>, addressesToCheck: string[]): Map<string, Keys> {
  let subset = new Map<string, Keys>();
  for (const [key, value] of addressesToKeys.entries()) {
    if (addressesToCheck.includes(key)) {
      subset.set(key, value);
    }
  }
  return subset;
}
export async function doOwnedSync(
  syncOptions: SyncOptions,
  startId: number,
  endId: number,
  addressToKeysMap: Map<string, Keys>
) {
  let recordMetadata: IRecordMetadata[] = await getRecordMetadata(startId, endId, syncOptions.includeTaggedRecords);
  const addresses = Array.from(addressToKeysMap.keys());

  while (recordMetadata.length > 0) {
    let retrievedEndId = recordMetadata[recordMetadata.length - 1].id;
    try {
      const start = performance.now();
      const useGpu = false;
      const ownedRecords = syncOptions.useGPU
        ? await scanRecordsGpu(addressToKeysMap, recordMetadata)
        : await scanRecordsDirect(addressToKeysMap, recordMetadata);
      await Repo.ownedRecords.bulkPut(ownedRecords);

      if (recordMetadata.length > MIN_RECORDS_FOR_PERFORMANCE_ANALYTICS) {
        const title = syncOptions.useGPU ? 'scanRecordsGpu' : 'scanRecordsDirect';
        await sendScanPerformanceEvent(title, {
          totalTime: performance.now() - start,
          numberOfRecords: recordMetadata.length,
          timePerRecord: (performance.now() - start) / recordMetadata.length
        });
      }
    } catch (e) {
      const scanner = syncOptions.useGPU ? 'gpu' : 'cpu';
      logger.error(`Failed to scan records via ${scanner}`, e);
      throw e;
    }
    // Update syncTime in Dexie for all addresses
    // eslint-disable-next-line no-loop-func
    const saveRecordSyncTasks = addresses.map(address =>
      Repo.recordIdSyncs.add({
        address: address,
        startId: startId, // inclusive
        endId: retrievedEndId + 1 // exlusive
      })
    );
    await Promise.all(saveRecordSyncTasks);

    // bump start Id to the next id right after the latest record Id we retrieved
    startId = retrievedEndId + 1;

    // Request more records from same block range
    recordMetadata = await getRecordMetadata(startId, endId, syncOptions.includeTaggedRecords);
  }

  await completeRecordSyncStep(addresses);
}

export async function completeOwnedRecords(keys: Keys[]) {
  const transitionIdAndIndexToAddressMap = new Map<string, string>();

  const unsyncedOwnedRecordsLimit = 100;
  let startIndex = 0;
}

export async function completeRecordSyncStep(addresses: string[]) {
  // Add combining completed syncs back once there is a shared global lock on syncing across all instances of the wallet.
  const combineAdjacentSyncs = addresses.map(async address => {
    return await combineAdjacentCompleteRecordSyncs(address);
  });
  await Promise.all(combineAdjacentSyncs);
}

export async function resyncAccount(address: string, chainId: string) {
  // Delete the data
  await Repo.records.where({ address, chainId }).delete();
  await Repo.transactions.where({ address, chainId }).delete();
  await Repo.transitions.where({ address, chainId }).delete();
  await Repo.ownedRecords.where({ address, chainId }).delete();

  // Delete the key files
  await Repo.keyFiles.clear();

  // Delete the sync times, triggering a full resync
  await Repo.recordIdSyncs.where({ address, chainId }).delete();
  await Repo.publicSyncs.where({ address, chainId }).delete();

  // Reset the sync analytics
  setLastPerformanceSent(0);
}

export async function deleteAccountData(address: string) {
  await Repo.records.where({ address }).delete();
  await Repo.transactions.where({ address }).delete();
  await Repo.transitions.where({ address }).delete();
  await Repo.ownedRecords.where({ address }).delete();
  await Repo.recordIdSyncs.where({ address }).delete();
  await Repo.publicSyncs.where({ address }).delete();
  await Repo.accountCreationBlockHeights.where({ address }).delete();
}
