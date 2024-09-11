import { IRecordIdSync } from 'lib/miden/db/types';
import * as Repo from 'lib/miden/repo';

import { getAccountCreationRecordId } from './account-creation';

/**
 * start: record id to start sync step, inclusive
 * end: record id to end sync step, exclusive
 * addressesToCheck: addresses to be included in the sync step
 */
export class RecordSyncStep {
  start: number;
  end: number;
  addressesToCheck: string[];

  constructor(start: number, end: number, addressesToCheck: string[]) {
    this.start = start;
    this.end = end;
    this.addressesToCheck = addressesToCheck;
  }
}

/**
 * Takes a list of sync times and returns which record id ranges need to be queried
 * and for each of those ranges which addresses need to perform ownership checks.
 * @param recordSyncs List of IRecordIdSync db objects, containing information about ranges already synced.
 * Assumes all recordSyncs have been completed, so just generates a plan outside of recordSyncs that are complete
 * or in-progress
 * @param currentRecord Current record id height that we're syncing to
 * @returns A list of RecordSyncSteps
 */
export async function createRecordSyncPlan(
  addresses: string[],
  currentRecord: number,
  batchSize: number
): Promise<RecordSyncStep[]> {
  const addressSyncPlanPromises = addresses.map(address => createSingleSyncPlan(address, currentRecord));

  let addressSyncPlans = (await Promise.all(addressSyncPlanPromises)).flat();
  let chunkedSyncPlans = addressSyncPlans.map(asp => chunkRecordSyncStep(asp, batchSize)).flat();
  let combinedSyncSteps = combineMatchingSyncSteps(chunkedSyncPlans);

  return combinedSyncSteps;
}

/**
 * Takes a list of sync times and returns which record id ranges need to be queried
 * and for each of those ranges which addresses need to perform ownership checks.
 * @param syncTimes List of ISyncTime db objects
 * @param currentRecordId Current record id height that we're syncing to
 * @returns A list of RecordSyncSteps
 */
export async function createSingleSyncPlan(address: string, currentRecordId: number): Promise<RecordSyncStep[]> {
  // get the minimum record id height that the address was created at
  const minRecordId = await getAccountCreationRecordId(address);

  // get all completed (or partial) record syncs for a given address
  const recordSyncs = await Repo.recordIdSyncs.where({ address: address }).toArray();

  // no record syncs found, this address needs to sync the entire chain to the chain height
  if (recordSyncs.length === 0) {
    const totalSync = new RecordSyncStep(minRecordId, currentRecordId + 1, [address]);
    return [totalSync];
  }

  let recordSyncSteps: RecordSyncStep[] = [];

  // some record syncs found, this address needs to sync any gaps between the syncs
  recordSyncs.sort((rs1, rs2) => rs1.startId - rs2.startId);
  for (let i = 0; i < recordSyncs.length - 1; i++) {
    const syncStart = recordSyncs[0].endId;
    const syncEnd = recordSyncs[1].startId;
    // for adjacent record syncs, there is no gap and therefore no extra sync step that needs to occur
    if (syncStart === syncEnd) {
      continue;
    }
    const betweenSyncStep = new RecordSyncStep(syncStart, syncEnd, [address]);
    recordSyncSteps.push(betweenSyncStep);
  }

  const earliestSync = recordSyncs[0];

  // if the earliest sync range does not include the minRecordId, a sync step from that id is necessary
  if (earliestSync.startId > minRecordId) {
    const genesisSyncStep = new RecordSyncStep(minRecordId, earliestSync.startId, [address]);
    recordSyncSteps.push(genesisSyncStep);
  }

  const latestSync = recordSyncs[recordSyncs.length - 1];
  // if the latest sync range does not include the head of of the chain (record id height @param currentRecordId), a sync
  // step to the head of the chain is necessary
  if (latestSync.endId <= currentRecordId) {
    const headSyncStep = new RecordSyncStep(latestSync.endId, currentRecordId + 1, [address]);
    recordSyncSteps.push(headSyncStep);
  }

  return recordSyncSteps;
}

export function chunkRecordSyncStep(recordSyncStep: RecordSyncStep, chunkSegmentSize: number) {
  if (recordSyncStep.end - recordSyncStep.start <= chunkSegmentSize) {
    return [recordSyncStep];
  }

  let chunkedSteps = [];
  let endChunkIndex = recordSyncStep.start;
  while (endChunkIndex < recordSyncStep.end) {
    const chunkStart = endChunkIndex;
    const chunkStartSegmentIndex = Math.floor(chunkStart / chunkSegmentSize);
    endChunkIndex = Math.min((chunkStartSegmentIndex + 1) * chunkSegmentSize, recordSyncStep.end);
    chunkedSteps.push(new RecordSyncStep(chunkStart, endChunkIndex, recordSyncStep.addressesToCheck));
  }

  return chunkedSteps;
}

export function combineMatchingSyncSteps(recordSyncSteps: RecordSyncStep[]): RecordSyncStep[] {
  let uniqueRanges: Map<string, RecordSyncStep> = new Map();
  recordSyncSteps.forEach(rss => {
    const range = `${rss.start}-${rss.end}`;
    if (uniqueRanges.has(range)) {
      let prevRSS = uniqueRanges.get(range)!;
      prevRSS.addressesToCheck = prevRSS.addressesToCheck.concat(rss.addressesToCheck);
      uniqueRanges.set(range, prevRSS);
    } else {
      uniqueRanges.set(range, rss);
    }
  });
  return [...uniqueRanges.values()];
}

export async function saveRecordSync(chainId: string, address: string, recordSyncStep: RecordSyncStep): Promise<void> {
  await Repo.recordIdSyncs.add({
    address: address,
    startId: recordSyncStep.start,
    endId: recordSyncStep.end
  });
}

export async function getEstimatedSyncPercentage(
  chainId: string,
  address: string,
  defaultSyncFraction: number
): Promise<number> {
  let savedSyncs = await Repo.recordIdSyncs.where({ chainId: chainId, address: address }).toArray();
  savedSyncs.sort((a, b) => b.endId - a.endId);
  if (savedSyncs.length === 0) {
    return defaultSyncFraction;
  }
  const latestSyncedRecordId = savedSyncs[0].endId;
  const totalRecordIdsSynced = savedSyncs.reduce((accumulator: number, currentValue: IRecordIdSync) => {
    return accumulator + (currentValue.endId - currentValue.startId);
  }, 0);

  const minRecordId = await getAccountCreationRecordId(address);

  return (1.0 * totalRecordIdsSynced) / (latestSyncedRecordId - minRecordId);
}

export async function getEstimatedSyncPercentages(chainId: string, addresses: string[]): Promise<Map<string, number>> {
  let syncPercentages = new Map<string, number>();
  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];
    const syncPercentage = await getEstimatedSyncPercentage(chainId, address, 0.0);
    syncPercentages.set(address, syncPercentage);
  }

  return syncPercentages;
}

export async function combineAdjacentCompleteRecordSyncs(address: string): Promise<void> {
  let allCompletedSyncs = await Repo.recordIdSyncs.where({ address: address }).toArray();

  allCompletedSyncs.sort((a, b) => a.startId - b.startId);

  const combinedSyncs: IRecordIdSync[] = [];

  for (let i = 0; i < allCompletedSyncs.length; i++) {
    let currentSync = allCompletedSyncs[i];

    // If there are no more syncs to check, add the current sync to the list of combined syncs.
    if (i === allCompletedSyncs.length - 1) {
      combinedSyncs.push(currentSync);
      break;
    }

    for (let j = i + 1; j < allCompletedSyncs.length; j++) {
      let nextSync = allCompletedSyncs[j];

      // If the end of the current range sync is equal to the start of the next sync, combine them into a single sync.
      if (currentSync.endId === nextSync.startId) {
        currentSync.endId = nextSync.endId;

        // Skip the next sync since it has been merged with the current sync.
        j++;
        i++;
      } else {
        break;
      }

      combinedSyncs.push(currentSync);
    }
  }

  await Repo.recordIdSyncs.where({ address: address }).delete();
  await Repo.recordIdSyncs.bulkAdd(combinedSyncs);
}
