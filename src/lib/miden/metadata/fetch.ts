import { BasicFungibleFaucetComponent } from '@demox-labs/miden-sdk';
import browser from 'webextension-polyfill';

import { isMidenAsset } from 'lib/miden/assets';

import { getMidenClient, withWasmClientLock } from '../sdk/miden-client';
import { DEFAULT_TOKEN_METADATA, MIDEN_METADATA } from './defaults';
import { AssetMetadata, DetailedAssetMetdata } from './types';

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
      thumbnailUri: browser.runtime.getURL('misc/token-logos/default.svg')
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
