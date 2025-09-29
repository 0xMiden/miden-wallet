import { BasicFungibleFaucetComponent } from '@demox-labs/miden-sdk';
import browser from 'webextension-polyfill';

import { isMidenAsset } from 'lib/miden/assets';

import { MidenClientInterface } from '../sdk/miden-client-interface';
import { DEFAULT_TOKEN_METADATA, MIDEN_METADATA } from './defaults';
import { AssetMetadata, DetailedAssetMetdata } from './types';

export async function fetchTokenMetadata(
  assetId: string
): Promise<{ base: AssetMetadata; detailed: DetailedAssetMetdata }> {
  if (isMidenAsset(assetId)) {
    return { base: MIDEN_METADATA, detailed: MIDEN_METADATA };
  }

  try {
    const midenClient = await MidenClientInterface.create();
    await midenClient.importAccountById(assetId);
    const account = await midenClient.getAccount(assetId);
    if (!account) {
      return { base: DEFAULT_TOKEN_METADATA, detailed: DEFAULT_TOKEN_METADATA };
    }
    const faucetDetails = BasicFungibleFaucetComponent.fromAccount(account);

    const base: AssetMetadata = {
      decimals: faucetDetails.decimals(),
      symbol: faucetDetails.symbol().toString(),
      name: faucetDetails.symbol().toString(),
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
