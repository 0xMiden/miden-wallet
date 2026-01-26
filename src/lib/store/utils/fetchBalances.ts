import { Address, FungibleAsset } from '@miden-sdk/miden-sdk';
import BigNumber from 'bignumber.js';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { getFaucetIdSetting } from 'lib/miden/assets';
import { TokenBalanceData } from 'lib/miden/front/balance';
import { AssetMetadata, fetchTokenMetadata, MIDEN_METADATA } from 'lib/miden/metadata';
import { getBech32AddressFromAccountId } from 'lib/miden/sdk/helpers';
import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';

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
 *
 * IMPORTANT: All WASM client operations (getAccount, importAccountById) are done
 * in a single lock acquisition to prevent AutoSync from blocking metadata fetches.
 * Previously, metadata was fetched in a separate lock after releasing the initial lock,
 * which caused non-MIDEN tokens to appear 30+ seconds late when AutoSync grabbed
 * the lock in between.
 */
export async function fetchBalances(
  network: MIDEN_NETWORK_NAME,
  address: string,
  tokenMetadatas: Record<string, AssetMetadata>,
  options: FetchBalancesOptions = {}
): Promise<TokenBalanceData[]> {
  const { setAssetsMetadata, fetchMissingMetadata = true } = options;
  const balances: TokenBalanceData[] = [];

  // Local copy of metadata that we can add to during this fetch
  const localMetadatas = { ...tokenMetadatas };

  // Get midenFaucetId early so we can use it inside the lock
  const midenFaucetId = await getFaucetIdSetting();

  // Wrap ALL WASM client operations in a single lock to prevent AutoSync from
  // grabbing the lock between getAccount and metadata fetches
  const { account, assets } = await withWasmClientLock(async () => {
    const midenClient = await getMidenClient({ network });
    const accountId = Address.fromBech32(address).accountId();
    const acc = await midenClient.getAccount(accountId.toString());

    // Handle case where account doesn't exist
    if (!acc) {
      return {
        account: null,
        assets: [] as FungibleAsset[]
      };
    }

    const acctAssets = acc.vault().fungibleAssets() as FungibleAsset[];

    return { account: acc, assets: acctAssets };
  });

  // Handle case where account doesn't exist (outside the lock)
  if (!account) {
    console.warn(`Account not found: ${address}`);
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

  // First pass: fetch missing metadata INLINE (so all tokens appear together)
  // fetchTokenMetadata already stores to Dexie faucetMetadatas table
  if (fetchMissingMetadata) {
    for (const asset of assets) {
      const id = getBech32AddressFromAccountId(asset.faucetId(), network);
      if (id !== midenFaucetId && !localMetadatas[id]) {
        try {
          const { base } = await fetchTokenMetadata(id, network);
          localMetadatas[id] = base;
          setAssetsMetadata?.({ [id]: base });
        } catch (e) {
          console.warn('Failed to fetch metadata for', id, e);
        }
      }
    }
  }

  // Build balance list
  let hasMiden = false;
  for (const asset of assets) {
    const tokenId = getBech32AddressFromAccountId(asset.faucetId(), network);
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
