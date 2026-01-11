import { BasicFungibleFaucetComponent } from '@demox-labs/miden-sdk';

import { isMidenAsset } from 'lib/miden/assets';

import { withWasmClientLock } from '../sdk/miden-client';
import { MIDEN_METADATA, DEFAULT_TOKEN_METADATA } from './defaults';
import { fetchTokenMetadata, NotFoundTokenMetadata } from './fetch';

jest.mock('webextension-polyfill', () => ({
  runtime: {
    getURL: jest.fn((path: string) => `chrome-extension://test-id/${path}`)
  }
}));

jest.mock('lib/miden/assets', () => ({
  isMidenAsset: jest.fn()
}));

jest.mock('../sdk/miden-client', () => ({
  getMidenClient: jest.fn(),
  withWasmClientLock: jest.fn()
}));

jest.mock('@demox-labs/miden-sdk', () => ({
  BasicFungibleFaucetComponent: {
    fromAccount: jest.fn()
  }
}));

const mockIsMidenAsset = isMidenAsset as unknown as jest.Mock;
const mockWithWasmClientLock = withWasmClientLock as unknown as jest.Mock;
const mockFromAccount = BasicFungibleFaucetComponent.fromAccount as unknown as jest.Mock;

describe('metadata/fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchTokenMetadata', () => {
    it('returns MIDEN_METADATA for miden asset', async () => {
      mockIsMidenAsset.mockReturnValue(true);

      const result = await fetchTokenMetadata('miden');

      expect(result).toEqual({
        base: MIDEN_METADATA,
        detailed: MIDEN_METADATA
      });
      expect(mockWithWasmClientLock).not.toHaveBeenCalled();
    });

    it('fetches metadata from SDK for non-miden assets', async () => {
      mockIsMidenAsset.mockReturnValue(false);
      mockWithWasmClientLock.mockResolvedValue({ decimals: 8, symbol: 'TEST' });

      const result = await fetchTokenMetadata('test-asset-id');

      expect(result.base).toEqual({
        decimals: 8,
        symbol: 'TEST',
        name: 'TEST',
        shouldPreferSymbol: true,
        thumbnailUri: 'chrome-extension://test-id/misc/token-logos/default.svg'
      });
      expect(result.detailed).toEqual(result.base);
    });

    it('returns DEFAULT_TOKEN_METADATA when account not found', async () => {
      mockIsMidenAsset.mockReturnValue(false);
      mockWithWasmClientLock.mockResolvedValue(null);

      const result = await fetchTokenMetadata('unknown-asset-id');

      expect(result).toEqual({
        base: DEFAULT_TOKEN_METADATA,
        detailed: DEFAULT_TOKEN_METADATA
      });
    });

    it('throws NotFoundTokenMetadata on SDK error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockIsMidenAsset.mockReturnValue(false);
      mockWithWasmClientLock.mockRejectedValue(new Error('SDK error'));

      await expect(fetchTokenMetadata('bad-asset-id')).rejects.toThrow(NotFoundTokenMetadata);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('NotFoundTokenMetadata', () => {
    it('has correct name and message', () => {
      const error = new NotFoundTokenMetadata();

      expect(error.name).toBe('NotFoundTokenMetadata');
      expect(error.message).toBe("Metadata for token doesn't found");
      expect(error).toBeInstanceOf(Error);
    });
  });
});
