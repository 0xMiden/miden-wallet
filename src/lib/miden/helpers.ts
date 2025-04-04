import { NoteType } from '@demox-labs/miden-sdk';

import { NoteTypeEnum, NoteType as NoteTypeString } from './types';

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

export const toNoteTypeString = (noteType: NoteType) =>
  noteType === NoteType.Public ? NoteTypeEnum.Public : NoteTypeEnum.Private;

export const toNoteType = (noteType: NoteTypeString) => (noteType === 'public' ? NoteType.Public : NoteType.Private);
