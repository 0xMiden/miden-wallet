import { isAleoAsset } from 'lib/miden/assets';

import { ALEO_METADATA } from './defaults';
import { AssetMetadata, DetailedAssetMetdata } from './types';

export async function fetchTokenMetadata(
  assetSlug: string
): Promise<{ base: AssetMetadata; detailed: DetailedAssetMetdata }> {
  const [contractAddress] = assetSlug.split('_');

  if (isAleoAsset(contractAddress)) {
    return { base: ALEO_METADATA, detailed: ALEO_METADATA };
  }

  try {
    // TODO: add validation
    const base: AssetMetadata = {
      decimals: 5,
      symbol: 'ASSET SYMBOL',
      name: 'ASSET NAME',
      shouldPreferSymbol: true,
      programId: '',
      mappingName: ''
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
