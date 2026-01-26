import { BasicFungibleFaucetComponent, FungibleAsset } from '@miden-sdk/miden-sdk';
import BigNumber from 'bignumber.js';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { getFaucetIdSetting } from 'lib/miden/assets';
import { TokenBalanceData } from 'lib/miden/front/balance';
import {
  AssetMetadata,
  DEFAULT_TOKEN_METADATA,
  fetchTokenMetadata,
  getAssetUrl,
  MIDEN_METADATA
} from 'lib/miden/metadata';
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
  const { account, assets, fetchedMetadatas } = await withWasmClientLock(async () => {
    const midenClient = await getMidenClient({ network });
    const acc = await midenClient.getAccount(address);

    // Handle case where account doesn't exist
    if (!acc) {
      return {
        account: null,
        assets: [] as FungibleAsset[],
        fetchedMetadatas: {} as Record<string, AssetMetadata>
      };
    }

    const acctAssets = acc.vault().fungibleAssets() as FungibleAsset[];

    // Fetch missing metadata INSIDE the lock to prevent race with AutoSync
    const newMetadatas: Record<string, AssetMetadata> = {};

    if (fetchMissingMetadata) {
      for (const asset of acctAssets) {
        const id = getBech32AddressFromAccountId(asset.faucetId(), network);
        // Skip MIDEN token and tokens we already have metadata for
        if (id === midenFaucetId || localMetadatas[id]) {
          continue;
        }

        try {
          // Inline the logic from fetchTokenMetadata to avoid separate lock acquisition
          let faucetAccount = await midenClient.getAccount(id);
          if (!faucetAccount) {
            await midenClient.importAccountById(id);
            faucetAccount = await midenClient.getAccount(id);
          }

          if (faucetAccount) {
            const faucetDetails = BasicFungibleFaucetComponent.fromAccount(faucetAccount);
            const symbol = faucetDetails.symbol().toString();
            newMetadatas[id] = {
              decimals: faucetDetails.decimals(),
              symbol,
              name: symbol,
              shouldPreferSymbol: true,
              thumbnailUri: getAssetUrl('misc/token-logos/default.svg')
            };
          } else {
            // Fallback if we couldn't get faucet account
            newMetadatas[id] = DEFAULT_TOKEN_METADATA;
          }
        } catch (e) {
          console.warn('Failed to fetch metadata for', id, e);
          // Use default metadata on failure so token still appears
          newMetadatas[id] = DEFAULT_TOKEN_METADATA;
        }
      }
    }

    return { account: acc, assets: acctAssets, fetchedMetadatas: newMetadatas };
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
  if (fetchMissingMetadata) {
    for (const asset of assets) {
      const id = getBech32AddressFromAccountId(asset.faucetId(), network);
      if (id !== midenFaucetId && !localMetadatas[id]) {
        try {
          const { base } = await fetchTokenMetadata(id, network);
          localMetadatas[id] = base;
          await setTokensBaseMetadata({ [id]: base });
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
