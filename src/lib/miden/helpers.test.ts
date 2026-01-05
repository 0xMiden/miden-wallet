jest.mock('@demox-labs/miden-sdk', () => ({
  NoteType: { Public: 'public', Private: 'private' }
}));

import { NoteType } from '@demox-labs/miden-sdk';

import { isAddressValid, toNoteType, toNoteTypeString } from './helpers';
import { NoteTypeEnum } from './types';

describe('miden helpers', () => {
  it('validates addresses permissively for now', () => {
    expect(isAddressValid('anything')).toBe(true);
  });

  it('converts note type enum to string and back', () => {
    expect(toNoteTypeString(NoteType.Public as any)).toBe(NoteTypeEnum.Public);
    expect(toNoteTypeString(NoteType.Private as any)).toBe(NoteTypeEnum.Private);
    expect(toNoteType(NoteTypeEnum.Public)).toBe(NoteType.Public);
    expect(toNoteType(NoteTypeEnum.Private)).toBe(NoteType.Private);
  });
});
