export const ONE_MB_IN_BYTES = 1024 * 1024;

export const getRandomBytesWithMaxSize = (bytesSize: number = ONE_MB_IN_BYTES): Uint8Array => {
  const sizeInBytes = Math.floor(Math.random() * bytesSize);
  const randomBytes = new Uint8Array(sizeInBytes);

  for (let i = 0; i < sizeInBytes; i++) {
    randomBytes[i] = Math.floor(Math.random() * 256); // Random byte values
  }

  return randomBytes;
};
