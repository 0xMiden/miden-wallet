import { u8ToB64, b64ToU8, bytesToHex } from './helpers';

describe('shared helpers', () => {
  describe('u8ToB64', () => {
    it('encodes empty array', () => {
      const result = u8ToB64(new Uint8Array([]));
      expect(result).toBe('');
    });

    it('encodes simple byte array', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = u8ToB64(bytes);
      expect(result).toBe('SGVsbG8=');
    });

    it('encodes binary data', () => {
      const bytes = new Uint8Array([0, 1, 2, 255, 254, 253]);
      const result = u8ToB64(bytes);
      expect(result).toBe('AAEC//79');
    });

    it('handles single byte', () => {
      const bytes = new Uint8Array([65]); // 'A'
      const result = u8ToB64(bytes);
      expect(result).toBe('QQ==');
    });
  });

  describe('b64ToU8', () => {
    it('decodes empty string', () => {
      const result = b64ToU8('');
      expect(result).toEqual(new Uint8Array([]));
    });

    it('decodes simple base64 string', () => {
      const result = b64ToU8('SGVsbG8=');
      expect(result).toEqual(new Uint8Array([72, 101, 108, 108, 111]));
    });

    it('decodes binary data', () => {
      const result = b64ToU8('AAEC//79');
      expect(result).toEqual(new Uint8Array([0, 1, 2, 255, 254, 253]));
    });

    it('handles single character', () => {
      const result = b64ToU8('QQ==');
      expect(result).toEqual(new Uint8Array([65]));
    });
  });

  describe('roundtrip encoding/decoding', () => {
    it('roundtrips correctly', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 100, 200, 255]);
      const encoded = u8ToB64(original);
      const decoded = b64ToU8(encoded);
      expect(decoded).toEqual(original);
    });

    it('roundtrips large array', () => {
      const original = new Uint8Array(1000);
      for (let i = 0; i < 1000; i++) {
        original[i] = i % 256;
      }
      const encoded = u8ToB64(original);
      const decoded = b64ToU8(encoded);
      expect(decoded).toEqual(original);
    });
  });

  describe('bytesToHex', () => {
    it('converts empty array', () => {
      const result = bytesToHex(new Uint8Array([]));
      expect(result).toBe('');
    });

    it('converts single byte', () => {
      const result = bytesToHex(new Uint8Array([255]));
      expect(result).toBe('ff');
    });

    it('pads single digit hex values', () => {
      const result = bytesToHex(new Uint8Array([0, 1, 15]));
      expect(result).toBe('00010f');
    });

    it('converts multiple bytes', () => {
      const result = bytesToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
      expect(result).toBe('deadbeef');
    });

    it('handles all byte values', () => {
      const bytes = new Uint8Array([0, 127, 128, 255]);
      const result = bytesToHex(bytes);
      expect(result).toBe('007f80ff');
    });
  });
});
