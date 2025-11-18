import { NoteType } from '@demox-labs/miden-sdk';

import { NoteTypeEnum, NoteType as NoteTypeString } from './types';

// TODO: implement address checks
export function isAddressValid(address: string) {
  return true;
}

export const toNoteTypeString = (noteType: NoteType) =>
  noteType === NoteType.Public ? NoteTypeEnum.Public : NoteTypeEnum.Private;

export const toNoteType = (noteType: NoteTypeString) => (noteType === 'public' ? NoteType.Public : NoteType.Private);
