import { AccountId, BasicFungibleFaucetComponent, Endpoint, RpcClient } from '@miden-sdk/miden-sdk';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { isMidenAsset } from 'lib/miden/assets';
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
  assetId: string,
  networkId: MIDEN_NETWORK_NAME
): Promise<{ base: AssetMetadata; detailed: DetailedAssetMetdata }> {
  if (isMidenAsset(assetId)) {
    return { base: MIDEN_METADATA, detailed: MIDEN_METADATA };
  }

  try {
    const getFaucetMetadata = async () => {
      const rpcClient = new RpcClient(Endpoint.testnet());

      const account = await rpcClient.getAccountDetails(AccountId.fromHex(assetId));

      const underlyingAccount = account.account();
      if (!underlyingAccount) {
        if (account.isPublic()) {
          throw new NotFoundTokenMetadata();
        }
        return;
      }
      const faucetDetails = BasicFungibleFaucetComponent.fromAccount(underlyingAccount);
      return {
        decimals: faucetDetails.decimals(),
        symbol: faucetDetails.symbol().toString()
      };
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
