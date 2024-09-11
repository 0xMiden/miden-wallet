import { spawn, Pool, Worker, FunctionThread } from 'threads';

import { IRecordMetadata } from 'lib/miden-chain/rpc-types';
import { IOwnedRecord } from 'lib/miden/db/types';
import { Keys } from 'lib/miden/front/autoSync';

type ScanRecordsDirectWorker = (
  addressToKeysMap: Map<string, Keys>,
  recordInfos: IRecordMetadata[]
) => Promise<IOwnedRecord[]>;
type ScanRecordsDirectPool = Pool<
  FunctionThread<[addressToKeysMap: Map<string, Keys>, recordInfos: IRecordMetadata[]], IOwnedRecord[]>
>;

// Create pool with maximum number of CPUs
const poolSize = Math.max(1, Math.floor(navigator.hardwareConcurrency / 2));
let pool: ScanRecordsDirectPool;

export const scanRecordsDirect = async (
  addressToKeysMap: Map<string, Keys>,
  recordInfos: IRecordMetadata[]
): Promise<IOwnedRecord[]> => {
  if (!pool) {
    pool = Pool(() => spawn<ScanRecordsDirectWorker>(new Worker('./scanRecordsDirect.js')), poolSize);
  }

  // Split records into roughly equal segments
  const splitRecordInfos = divideRecordInfos(recordInfos, poolSize);
  // Schedule tasks in parallel
  const tasks = splitRecordInfos.map(recs =>
    pool.queue(async scanRecordsDirect => {
      return await scanRecordsDirect(addressToKeysMap, recs);
    })
  );
  // Wait for tasks to finish and get results
  const ownedRecords: IOwnedRecord[] = (await Promise.all(tasks)).flat();
  return ownedRecords;
};

function divideRecordInfos(recordInfos: IRecordMetadata[], numberOfThreads: number): IRecordMetadata[][] {
  const splitRecords: IRecordMetadata[][] = [];
  // If the number of records is low enough, just use one task
  if (numberOfThreads * 10 > recordInfos.length) {
    return [recordInfos];
  }

  // Get the average chunk size
  const chunkSize = Math.floor(recordInfos.length / numberOfThreads);

  // Split work into n - 1 sub-arrays
  let startIndex = 0;
  for (let i = 0; i < numberOfThreads - 1; i++) {
    const endIndex = startIndex + chunkSize;
    splitRecords.push(recordInfos.slice(startIndex, endIndex));
    startIndex = endIndex;
  }

  // Add remaining elements as last sub-array
  splitRecords.push(recordInfos.slice(startIndex));

  return splitRecords;
}
