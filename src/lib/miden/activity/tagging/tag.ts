import { sha256 } from '@noble/hashes/sha256';

import { tagRecord } from 'lib/miden-chain';
import { IRecordMetadata } from 'lib/miden-chain/rpc-types';
import { beginProveTagsWorkers } from 'lib/miden-worker/proveTags';
import { Keys } from 'lib/miden/front/autoSync';
import * as Repo from 'lib/miden/repo';

export type TagProof = {
  recordId: string;
  tag: string;
  proof: string;
};

export type ProofInputs = {
  tag: string;
  address: string;
  viewKey: string;
  recordMetadata: IRecordMetadata;
};

const TAG_PREFIX = 'leo-wallet-tag';
const TAG_DELIMITER = '-';
const ALEO_SCALAR_MODULUS = BigInt('8444461749428370424248824938781546531375899335154063827935233455917409239041');

export const collectProofInputs = async (keys: Keys[]): Promise<ProofInputs[]> => {
  const untaggedRecords = Repo.ownedRecords.filter(r => r.tag === '');
  const untaggedRecordsArray = await untaggedRecords.toArray();

  if (untaggedRecordsArray.length === 0) {
    return [];
  }

  const addressToKeysMap = {} as Map<string, Keys>;

  const taggedRecords = Repo.ownedRecords.filter(r => !!r.tag);
  const taggedRecordsArray = await taggedRecords.toArray();

  const addressToNextTagIndex = new Map<string, number>();
  for (let address of addressToKeysMap.keys()) {
    const nextIndex = taggedRecordsArray.filter(r => r.address === address).length;
    addressToNextTagIndex.set(address, nextIndex);
  }

  const proofInputs = untaggedRecordsArray.map(record => {
    const viewKey = addressToKeysMap.get(record.address)?.viewKey;
    const address = record.address;
    const nextTagIndex = addressToNextTagIndex.get(address) ?? 0;

    const tag = TAG_PREFIX + TAG_DELIMITER + TAG_DELIMITER + viewKey + TAG_DELIMITER + nextTagIndex;
    const hash = sha256(tag);

    // Convert Uint8Array to hex string for BigInt
    const hashHex = BigInt('0x' + Array.from(hash, byte => byte.toString(16).padStart(2, '0')).join(''));

    // Need to perform modulo so the tag is representable on the Aleo circuit field
    const encryptedTag = (hashHex % ALEO_SCALAR_MODULUS).toString();

    const proofInput: ProofInputs = {
      tag: encryptedTag,
      address: address,
      viewKey: viewKey!,
      recordMetadata: {
        id: parseInt(record.id),
        nonce_x: record.nonce_x,
        nonce_y: record.nonce_y,
        owner_x: record.owner_x,
        transition_id: record.transition_id,
        output_index: record.output_index
      }
    };

    addressToNextTagIndex.set(address, nextTagIndex + 1);

    return proofInput;
  });

  return proofInputs;
};

export const tagOwnedRecords = async (keys: Keys[]): Promise<void> => {
  let proofInputs = await collectProofInputs(keys);

  const tagProofs = await beginProveTagsWorkers(proofInputs);
  for (const tagProof of tagProofs) {
    try {
      const tag = await tagRecord();
      // if (tag) {
      //   Repo.ownedRecords.update(tagProof.recordId, { tag: tagProof.tag });
      // }
    } catch (e) {
      console.error('Unable to tag the record. Error: ' + e);
    }
  }
};
