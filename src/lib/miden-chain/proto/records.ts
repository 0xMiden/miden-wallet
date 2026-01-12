/* eslint-disable */
import * as _m0 from 'protobufjs/minimal';

export const protobufPackage = '';

export interface RecordInfo {
  transitionId: string;
  nonceX: string;
  nonceY: string;
  ownerX: string;
  outputIndex: number;
}

export interface RecordInfoList {
  records: RecordInfo[];
}

function createBaseRecordInfo(): RecordInfo {
  return { transitionId: '', nonceX: '', nonceY: '', ownerX: '', outputIndex: 0 };
}

export const RecordInfo = {
  encode(message: RecordInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.transitionId !== '') {
      writer.uint32(10).string(message.transitionId);
    }
    if (message.nonceX !== '') {
      writer.uint32(18).string(message.nonceX);
    }
    if (message.nonceY !== '') {
      writer.uint32(26).string(message.nonceY);
    }
    if (message.ownerX !== '') {
      writer.uint32(34).string(message.ownerX);
    }
    if (message.outputIndex !== 0) {
      writer.uint32(40).int32(message.outputIndex);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RecordInfo {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRecordInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.transitionId = reader.string();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.nonceX = reader.string();
          continue;
        case 3:
          if (tag !== 26) {
            break;
          }

          message.nonceY = reader.string();
          continue;
        case 4:
          if (tag !== 34) {
            break;
          }

          message.ownerX = reader.string();
          continue;
        case 5:
          if (tag !== 40) {
            break;
          }

          message.outputIndex = reader.int32();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): RecordInfo {
    return {
      transitionId: isSet(object.transitionId) ? globalThis.String(object.transitionId) : '',
      nonceX: isSet(object.nonceX) ? globalThis.String(object.nonceX) : '',
      nonceY: isSet(object.nonceY) ? globalThis.String(object.nonceY) : '',
      ownerX: isSet(object.ownerX) ? globalThis.String(object.ownerX) : '',
      outputIndex: isSet(object.outputIndex) ? globalThis.Number(object.outputIndex) : 0
    };
  },

  toJSON(message: RecordInfo): unknown {
    const obj: any = {};
    if (message.transitionId !== '') {
      obj.transitionId = message.transitionId;
    }
    if (message.nonceX !== '') {
      obj.nonceX = message.nonceX;
    }
    if (message.nonceY !== '') {
      obj.nonceY = message.nonceY;
    }
    if (message.ownerX !== '') {
      obj.ownerX = message.ownerX;
    }
    if (message.outputIndex !== 0) {
      obj.outputIndex = Math.round(message.outputIndex);
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<RecordInfo>, I>>(base?: I): RecordInfo {
    return RecordInfo.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<RecordInfo>, I>>(object: I): RecordInfo {
    const message = createBaseRecordInfo();
    message.transitionId = object.transitionId ?? '';
    message.nonceX = object.nonceX ?? '';
    message.nonceY = object.nonceY ?? '';
    message.ownerX = object.ownerX ?? '';
    message.outputIndex = object.outputIndex ?? 0;
    return message;
  }
};

function createBaseRecordInfoList(): RecordInfoList {
  return { records: [] };
}

export const RecordInfoList = {
  encode(message: RecordInfoList, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.records) {
      RecordInfo.encode(v!, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): RecordInfoList {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseRecordInfoList();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.records.push(RecordInfo.decode(reader, reader.uint32()));
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): RecordInfoList {
    return {
      records: globalThis.Array.isArray(object?.records) ? object.records.map((e: any) => RecordInfo.fromJSON(e)) : []
    };
  },

  toJSON(message: RecordInfoList): unknown {
    const obj: any = {};
    if (message.records?.length) {
      obj.records = message.records.map(e => RecordInfo.toJSON(e));
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<RecordInfoList>, I>>(base?: I): RecordInfoList {
    return RecordInfoList.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<RecordInfoList>, I>>(object: I): RecordInfoList {
    const message = createBaseRecordInfoList();
    message.records = object.records?.map(e => RecordInfo.fromPartial(e)) || [];
    return message;
  }
};

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends globalThis.Array<infer U>
    ? globalThis.Array<DeepPartial<U>>
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : T extends {}
        ? { [K in keyof T]?: DeepPartial<T[K]> }
        : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
