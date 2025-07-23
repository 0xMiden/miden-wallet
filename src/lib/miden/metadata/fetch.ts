import browser from 'webextension-polyfill';

import { isMidenAsset } from 'lib/miden/assets';

import { MidenClientInterface } from '../sdk/miden-client-interface';
import { MIDEN_METADATA } from './defaults';
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

    const base: AssetMetadata = {
      decimals: 5,
      symbol: 'ASSET SYMBOL',
      name: 'ASSET NAME',
      shouldPreferSymbol: true,
      programId: '',
      mappingName: '',
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
