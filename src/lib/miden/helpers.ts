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

export function u8ToB64(u8: Uint8Array): string {
  let s = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < u8.length; i += CHUNK) {
    s += String.fromCharCode(...u8.subarray(i, i + CHUNK));
  }
  return btoa(s);
}

export function b64ToU8(b64: string): Uint8Array {
  const s = atob(b64);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}
