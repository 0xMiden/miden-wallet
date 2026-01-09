import { FungibleAsset } from '@demox-labs/miden-sdk';
import BigNumber from 'bignumber.js';

import { getFaucetIdSetting } from 'lib/miden/assets';
import { TokenBalanceData } from 'lib/miden/front/balance';
import { AssetMetadata, fetchTokenMetadata, MIDEN_METADATA } from 'lib/miden/metadata';
import { getBech32AddressFromAccountId } from 'lib/miden/sdk/helpers';
import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';

import { setTokensBaseMetadata } from '../../miden/front/assets';

export interface FetchBalancesOptions {
  /** Callback to update asset metadata in the store */
  setAssetsMetadata?: (metadata: Record<string, AssetMetadata>) => void;
  /** Whether to fetch missing metadata inline (default: true) */
  fetchMissingMetadata?: boolean;
}

/**
 * Fetch all token balances for an account
 *
 * This is the single source of truth for balance fetching logic.
 * Used by both the useAllBalances hook and the Zustand store action.
 */
export async function fetchBalances(
  address: string,
  tokenMetadatas: Record<string, AssetMetadata>,
  options: FetchBalancesOptions = {}
): Promise<TokenBalanceData[]> {
  const { setAssetsMetadata, fetchMissingMetadata = true } = options;
  const balances: TokenBalanceData[] = [];

  // Local copy of metadata that we can add to during this fetch
  const localMetadatas = { ...tokenMetadatas };

  // Wrap all WASM client operations in a lock to prevent concurrent access
  const { account, assets } = await withWasmClientLock(async () => {
    const midenClient = await getMidenClient();
    const acc = await midenClient.getAccount(address);

    // Handle case where account doesn't exist
    if (!acc) {
      return { account: null, assets: [] as FungibleAsset[] };
    }

    const acctAssets = acc.vault().fungibleAssets() as FungibleAsset[];
    return { account: acc, assets: acctAssets };
  });

  // Handle case where account doesn't exist (outside the lock)
  if (!account) {
    console.warn(`Account not found: ${address}`);
    const midenFaucetId = await getFaucetIdSetting();
    return [
      {
        tokenId: midenFaucetId,
        tokenSlug: 'MIDEN',
        metadata: MIDEN_METADATA,
        fiatPrice: 1,
        balance: 0
      }
    ];
  }
  const midenFaucetId = await getFaucetIdSetting();
  let hasMiden = false;

  // First pass: fetch missing metadata INLINE (so all tokens appear together)
  if (fetchMissingMetadata) {
    for (const asset of assets) {
      const id = getBech32AddressFromAccountId(asset.faucetId());
      if (id !== midenFaucetId && !localMetadatas[id]) {
        try {
          const { base } = await fetchTokenMetadata(id);
          localMetadatas[id] = base;
          await setTokensBaseMetadata({ [id]: base });
          setAssetsMetadata?.({ [id]: base });
        } catch (e) {
          console.warn('Failed to fetch metadata for', id, e);
        }
      }
    }
  }

  // Second pass: build balance list
  for (const asset of assets) {
    const tokenId = getBech32AddressFromAccountId(asset.faucetId());
    const isMiden = tokenId === midenFaucetId;

    if (isMiden) {
      hasMiden = true;
    }

    const tokenMetadata = isMiden ? MIDEN_METADATA : localMetadatas[tokenId];
    if (!tokenMetadata) {
      // Skip assets without metadata (metadata fetch failed)
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

  // Always include MIDEN token (even if balance is 0)
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
