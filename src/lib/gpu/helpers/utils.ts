import { bech32m } from 'bech32';
import BN from 'bn.js';
import bs58 from 'bs58';

export const bigIntsToU32Array = (beBigInts: bigint[]): Uint32Array => {
  const intsAs32s = beBigInts.map(bigInt => bigIntToU32Array(bigInt));
  const u32Array = new Uint32Array(beBigInts.length * 8);
  intsAs32s.forEach((intAs32, index) => {
    u32Array.set(intAs32, index * 8);
  });
  return u32Array;
};

export const bigIntToU32Array = (beBigInt: bigint): Uint32Array => {
  const numBits = 256;
  const bitsPerElement = 32;
  const numElements = numBits / bitsPerElement;
  const u32Array = new Uint32Array(numElements);
  const nonZeroBitString = beBigInt.toString(2);
  const paddedZeros = '0'.repeat(numBits - nonZeroBitString.length);
  const bitString = paddedZeros + nonZeroBitString;
  for (let i = 0; i < numElements; i++) {
    const startIndex = i * bitsPerElement;
    const endIndex = startIndex + bitsPerElement;
    const bitStringSlice = bitString.slice(startIndex, endIndex);
    const u32 = parseInt(bitStringSlice, 2);
    u32Array[i] = u32;
  }

  return u32Array;
};

export const u32ArrayToBigInts = (u32Array: Uint32Array): bigint[] => {
  const bigInts = [];
  for (let i = 0; i < u32Array.length; i += 8) {
    const u32s = u32Array.slice(i, i + 8);
    let bigIntString = '';
    for (let j = 0; j < u32s.length; j++) {
      const u32 = u32s[j];
      const u32String = u32.toString(2);
      const paddedZeros = '0'.repeat(32 - u32String.length);
      bigIntString = bigIntString + paddedZeros + u32String;
    }
    const bigInt = BigInt('0b' + bigIntString);
    bigInts.push(bigInt);
  }
  return bigInts;
};

export const parseAddressToXCoordinate = (address: string): bigint => {
  const bytes = parseToBytes(address, 'aleo', 63);
  return BigInt(convertBytesToFieldElement(bytes));
};

export const parseViewKeyToScalar = (viewKey: string): bigint => {
  let bytes = bs58.decode(viewKey);
  bytes = bytes.slice(7);
  return BigInt(convertBytesToFieldElement(bytes));
};

const parseToBytes = (stringToParse: string, stringPrefix: string, expectedLength: number): Uint8Array => {
  // Ensure the address string length is 63 characters.
  if (stringToParse.length !== expectedLength) {
    throw new Error(`Invalid length: found ${stringToParse.length}, expected ${expectedLength}`);
  }

  // Decode the address string from bech32m.
  const { prefix, words: data } = bech32m.decode(stringToParse);

  if (prefix !== stringPrefix) {
    throw new Error(`Failed to decode address: '${prefix}' is an invalid prefix`);
  } else if (data.length === 0) {
    throw new Error('Failed to decode address: data field is empty');
  }

  const u8Data = bech32m.fromWords(data);
  // Decode the address data from u5 to u8, and into an account address.
  return new Uint8Array(u8Data);
};

const convertBytesToFieldElement = (bytes: Uint8Array): string => {
  const fieldElement = new BN(bytes, 16, 'le');
  return fieldElement.toString();
};

export const addNeededBuffers = (
  gpu: GPUDevice,
  size: number,
  amount: number,
  bufferMap: Map<number, GPUBuffer[]>
): Map<number, GPUBuffer[]> => {
  const currentBuffers = bufferMap.get(size) ?? [];
  if (currentBuffers.length >= amount) {
    return bufferMap;
  }

  const length = currentBuffers.length;
  const neededBuffers = amount - currentBuffers.length;
  for (let i = 0; i < neededBuffers; i++) {
    currentBuffers.push(
      gpu.createBuffer({
        label: `buffer of size ${size} number ${length + i}`,
        size: size,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
      })
    );
  }
  bufferMap.set(size, currentBuffers);

  return bufferMap;
};
