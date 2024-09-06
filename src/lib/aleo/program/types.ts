// Top most level of the input tree for an aleo program. These all have a register, type, and visibility.
export type AleoInput = AleoLiteralInput | AleoRecordInput | AleoStructInput | AleoExternalRecordInput | AleoArrayInput;
export type AleoMember = AleoLiteralMember | AleoStructMember | AleoArrayMember;

export interface AleoLiteralInput {
  type: string;
  register: string;
  visibility: 'public' | 'private';
}

// This is a part of another input, so it doesn't have a register or visibility.
export interface AleoLiteralMember {
  name: string;
  type: string;
}

export interface AleoExternalRecordInput {
  type: 'external_record';
  locator: string;
  register: string;
}

export interface AleoRecordInput {
  type: 'record';
  record: string;
  members: AleoMember[];
  register: string;
}

export interface AleoStructInput {
  type: 'struct';
  struct_id: string;
  members: AleoMember[];
  register: string;
}

// This is a part of a struct, either a struct input or a struct that is part of another input.
export interface AleoStructMember {
  name: string;
  type: 'struct';
  struct_id: string;
  members: AleoMember[];
}

export interface AleoArrayInput {
  type: 'array';
  element_type: {
    type: string;
  };
  length: number;
  register: string;
  visibility: 'public' | 'private';
}

// This is part of an array, either a part of a struct or a nested array
export interface AleoArrayMember {
  name: string;
  type: 'array';
  element_type: AleoMember;
  length: number;
}
