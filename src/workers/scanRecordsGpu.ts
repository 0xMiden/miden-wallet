import { expose } from 'threads/worker';

import { IRecordMetadata } from 'lib/miden-chain/rpc-types';
import { IOwnedRecord } from 'lib/miden/db/types';
import { Keys } from 'lib/miden/front/autoSync';
import {
  bigIntToU32Array,
  bigIntsToU32Array,
  parseAddressToXCoordinate,
  parseViewKeyToScalar,
  u32ArrayToBigInts
} from 'lib/gpu/helpers/utils';
import { is_owner_multi } from 'lib/gpu/isOwner';
import { aleoMdStrings, aleoRoundConstantStrings } from 'lib/gpu/poseidonParams';
import { logger } from 'shared/logger';

async function scanRecordsGpu(
  addressToKeysMap: Map<string, Keys>,
  recordInfos: IRecordMetadata[]
): Promise<IOwnedRecord[]> {
  const addresses = Array.from(addressToKeysMap.keys());

  const bigIntAleoMds = aleoMdStrings.map(arr => arr.map(str => BigInt(str))).flat();
  const aleoMds = Array.from(bigIntsToU32Array(bigIntAleoMds));
  const bigIntAleoRoundConstants = aleoRoundConstantStrings.map(arr => arr.map(str => BigInt(str))).flat();
  const aleoRoundConstants = Array.from(bigIntsToU32Array(bigIntAleoRoundConstants));

  const bigIntPointInputs = recordInfos
    .map(recordInfo => [BigInt(recordInfo.nonce_x), BigInt(recordInfo.nonce_y)])
    .flat();
  const pointInputs = Array.from(bigIntsToU32Array(bigIntPointInputs));

  const bigIntOwner = recordInfos.map(recordInfo => BigInt(recordInfo.owner_x)).flat();
  const ownerFields = Array.from(bigIntsToU32Array(bigIntOwner));

  const ownedRecords: IOwnedRecord[] = [];
  for (const address of addresses) {
    const keys = addressToKeysMap.get(address);
    if (!keys) {
      logger.error('No keys found for address', address);
      throw new Error('No keys found for address');
    }

    const bigIntViewKeyScalar = parseViewKeyToScalar(keys.viewKey);
    const viewKeyScalar = Array.from(bigIntToU32Array(bigIntViewKeyScalar));

    const bigIntAddressX = parseAddressToXCoordinate(address);
    const addressX = Array.from(bigIntToU32Array(bigIntAddressX));
    const result = await is_owner_multi(pointInputs, ownerFields, aleoMds, aleoRoundConstants, viewKeyScalar, addressX);
    const bigIntResults = u32ArrayToBigInts(result);

    const ownedRecordInfos: IRecordMetadata[] = [];
    for (let i = 0; i < bigIntResults.length; i++) {
      if (bigIntResults[i] === BigInt(0)) {
        ownedRecordInfos.push(recordInfos[i]);
      }
    }

    const records: IOwnedRecord[] = ownedRecordInfos.map(recordInfo => {
      const ownedRecord: IOwnedRecord = {
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
      return ownedRecord;
    });

    ownedRecords.push(...records);
  }

  return ownedRecords;
}

expose(scanRecordsGpu);
