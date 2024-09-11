import { expose } from 'threads/worker';

import { IRecordMetadata } from 'lib/miden-chain/rpc-types';
import { IOwnedRecord } from 'lib/miden/db/types';
import { Keys } from 'lib/miden/front/autoSync';
import { logger } from 'shared/logger';

async function scanRecordsDirect(
  addressToKeysMap: Map<string, Keys>,
  recordInfos: IRecordMetadata[]
): Promise<IOwnedRecord[]> {
  try {
    const addresses = Array.from(addressToKeysMap.keys());

    const ownedRecords: IOwnedRecord[] = [];
    for (const address of addresses) {
      const key = addressToKeysMap.get(address);
      if (!key) {
        logger.error('No keys found for address', address);
        throw new Error('No keys found for address');
      }

      const ownedRecordInfos: IRecordMetadata[] = [];
      for (const recordInfo of recordInfos) {
        try {
        } catch (err: any) {
          logger.error(`Error checking if record is owned ${JSON.stringify(recordInfo)}`, err);
        }
      }

      const records: IOwnedRecord[] = ownedRecordInfos.map(recordInfo => {
        return {
          id: recordInfo.id.toString(),
          address,
          transition_id: recordInfo.transition_id,
          output_index: +recordInfo.output_index,
          synced: 0,
          tag: '',
          nonce_x: recordInfo.nonce_x,
          nonce_y: recordInfo.nonce_y,
          owner_x: recordInfo.owner_x
        };
      });

      ownedRecords.push(...records);
    }

    return ownedRecords;
  } catch (err: any) {
    console.error(err);
    return [];
  }
}

expose(scanRecordsDirect);
