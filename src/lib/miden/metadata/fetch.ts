import { Address, BasicFungibleFaucetComponent, Endpoint, RpcClient } from '@miden-sdk/miden-sdk';

import { isMidenAsset } from 'lib/miden/assets';
import * as Repo from 'lib/miden/repo';
import { isExtension } from 'lib/platform';

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
    const existing = await Repo.faucetMetadatas.get(assetId);

    if (existing) {
      const base: AssetMetadata = {
        decimals: existing.decimals,
        symbol: existing.symbol,
        name: existing.symbol,
        shouldPreferSymbol: true,
        thumbnailUri: getAssetUrl('misc/token-logos/default.svg')
      };
      const detailed: DetailedAssetMetdata = {
        ...base
      };
      return { base, detailed };
    }

    const getFaucetMetadata = async () => {
      try {
        const endpoint = Endpoint.testnet();
        const rpcClient = new RpcClient(endpoint);
        const account = await rpcClient.getAccountDetails(Address.fromBech32(assetId).accountId());
        const underlyingAccount = account.account();
        if (!underlyingAccount) {
          if (account.isPublic()) {
            // if the account was public and we couldn't fetch metadata it should not happen in first place
            // but in case it does we are storing it as unknown metadata and warning in console
            console.warn('Failed to fetch metadata from chain for', assetId, 'Using default metadata');
          }
          // if the account is private we are assinging it the unknown metadata, as there is no way to fetch the metadata from chain
          return;
        }
        const faucetDetails = BasicFungibleFaucetComponent.fromAccount(underlyingAccount);
        return {
          decimals: faucetDetails.decimals(),
          symbol: faucetDetails.symbol().toString()
        };
      } catch (e) {
        console.warn('Failed to fetch metadata from chain for', assetId, e, 'Using default metadata');
        return;
      }
    };

    const result = await getFaucetMetadata();
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
