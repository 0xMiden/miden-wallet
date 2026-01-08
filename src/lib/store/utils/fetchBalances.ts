import { FungibleAsset } from '@demox-labs/miden-sdk';
import BigNumber from 'bignumber.js';

import { getFaucetIdSetting } from 'lib/miden/assets';
import { TokenBalanceData } from 'lib/miden/front/balance';
import { AssetMetadata, MIDEN_METADATA } from 'lib/miden/metadata';
import { getBech32AddressFromAccountId } from 'lib/miden/sdk/helpers';
import { getMidenClient } from 'lib/miden/sdk/miden-client';

export async function fetchBalances(
  address: string,
  tokenMetadatas: Record<string, AssetMetadata>
): Promise<TokenBalanceData[]> {
  const balances: TokenBalanceData[] = [];

  const midenClient = await getMidenClient();
  const account = await midenClient.getAccount(address);
  const assets = account!.vault().fungibleAssets() as FungibleAsset[];
  const midenFaucetId = await getFaucetIdSetting();
  let hasMiden = false;

  for (const asset of assets) {
    const tokenId = getBech32AddressFromAccountId(asset.faucetId());
    const isMiden = tokenId === midenFaucetId;
    if (isMiden) {
      hasMiden = true;
    }
    const tokenMetadata = isMiden ? MIDEN_METADATA : tokenMetadatas[tokenId];
    if (!tokenMetadata) {
      continue;
    }
    const balance = new BigNumber(asset.amount().toString()).div(10 ** tokenMetadata.decimals);
    balances.push({
      tokenId,
      tokenSlug: tokenMetadata.symbol,
      metadata: tokenMetadata,
      fiatPrice: 1,
      balance: balance.toNumber()
    });
  }

  if (!hasMiden) {
    balances.push({
      tokenId: midenFaucetId,
      tokenSlug: 'MIDEN',
      metadata: MIDEN_METADATA,
      fiatPrice: 1,
      balance: 0
    });
  }

  return balances;
}
