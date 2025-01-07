import memoize from 'micro-memoize';

import { IRecord } from './db/types';
import { NETWORKS } from './networks';

// TODO: implement address checks
export function isAddressValid(address: string) {
  return true;
}

export function isViewKeyValid(viewKey: string) {
  return true;
}

export const getANSAddress = async (ansName: string) => {};

export const canDecryptRecordCiphertext = (viewKey: string, ciphertextString: string): boolean => {
  return true;
};

// mimics the serialization of the TokenOwner struct in the MTSP
export const getMtspMappingKey = () => {};

export const getMtspPlaintextRecord = () => {};

export const canDecryptMtspPlaintextRecord = () => {};

export const getMtspRecordAmount = () => {};

export const getTokenIdFromFinalize = (finalizeString: string) => {};
