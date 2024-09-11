import { spawn, Pool, Worker, FunctionThread } from 'threads';

import { IRecordMetadata } from 'lib/miden-chain/rpc-types';
import { IOwnedRecord } from 'lib/miden/db/types';
import { Keys } from 'lib/miden/front/autoSync';

type ScanRecordsGpuWorker = (
  addressToKeysMap: Map<string, Keys>,
  recordInfos: IRecordMetadata[]
) => Promise<IOwnedRecord[]>;
type ScanRecordsGpuPool = Pool<
  FunctionThread<[addressToKeysMap: Map<string, Keys>, recordInfos: IRecordMetadata[]], IOwnedRecord[]>
>;

const poolSize = 1;
let pool: ScanRecordsGpuPool;

export const scanRecordsGpu = async (
  addressToKeysMap: Map<string, Keys>,
  recordInfos: IRecordMetadata[]
): Promise<IOwnedRecord[]> => {
  if (!pool) {
    pool = Pool(() => spawn<ScanRecordsGpuWorker>(new Worker('./scanRecordsGpu.js')), poolSize);
  }

  return await pool.queue(async scanRecordsGpu => {
    return await scanRecordsGpu(addressToKeysMap, recordInfos);
  });
};
