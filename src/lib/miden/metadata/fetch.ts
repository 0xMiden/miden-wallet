import { BasicFungibleFaucetComponent } from '@miden-sdk/miden-sdk';

import { isMidenAsset } from 'lib/miden/assets';
import { isExtension } from 'lib/platform';

import { getMidenClient, withWasmClientLock } from '../sdk/miden-client';
import { DEFAULT_TOKEN_METADATA, MIDEN_METADATA } from './defaults';
import { AssetMetadata, DetailedAssetMetdata } from './types';

// Get asset URL that works on extension, mobile, and desktop
function getAssetUrl(path: string): string {
  if (!isExtension()) {
    // On mobile/desktop, use relative URL from web root
    return `/${path}`;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const browser = require('webextension-polyfill');
    return browser.runtime.getURL(path);
  } catch {
    return `/${path}`;
  }
}

export async function fetchTokenMetadata(
  assetId: string
): Promise<{ base: AssetMetadata; detailed: DetailedAssetMetdata }> {
  if (isMidenAsset(assetId)) {
    return { base: MIDEN_METADATA, detailed: MIDEN_METADATA };
  }

  try {
    // Wrap all WASM client operations in a lock to prevent concurrent access
    const result = await withWasmClientLock(async () => {
      const midenClient = await getMidenClient();

      let account = await midenClient.getAccount(assetId);
      if (!account) {
        await midenClient.importAccountById(assetId);
        account = await midenClient.getAccount(assetId);
        if (!account) {
          return null;
        }
      }
      const faucetDetails = BasicFungibleFaucetComponent.fromAccount(account);
      return {
        decimals: faucetDetails.decimals(),
        symbol: faucetDetails.symbol().toString()
      };
    });

    if (!result) {
      return { base: DEFAULT_TOKEN_METADATA, detailed: DEFAULT_TOKEN_METADATA };
    }

    const { decimals, symbol } = result;

    const base: AssetMetadata = {
      decimals,
      symbol,
      name: symbol,
      shouldPreferSymbol: true,
      thumbnailUri: getAssetUrl('misc/token-logos/default.svg')
    };

    const detailed: DetailedAssetMetdata = {
      ...base
    };

    return { base, detailed };
  } catch (err: any) {
    console.error(err);

    throw new NotFoundTokenMetadata();
  }
}

export class NotFoundTokenMetadata extends Error {
  name = 'NotFoundTokenMetadata';
  message = "Metadata for token doesn't found";
}
