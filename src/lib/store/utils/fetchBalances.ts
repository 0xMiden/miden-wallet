import { FungibleAsset } from '@demox-labs/miden-sdk';
import BigNumber from 'bignumber.js';

import { getFaucetIdSetting } from 'lib/miden/assets';
import { TokenBalanceData } from 'lib/miden/front/balance';
import { AssetMetadata, fetchTokenMetadata, MIDEN_METADATA } from 'lib/miden/metadata';
import { getBech32AddressFromAccountId } from 'lib/miden/sdk/helpers';
import { getMidenClient, runWhenClientIdle, withWasmClientLock } from 'lib/miden/sdk/miden-client';
import { useWalletStore } from 'lib/store';

import { setTokensBaseMetadata } from '../../miden/front/assets';

// Track in-flight metadata requests to avoid duplicates
const inFlightMetadata = new Set<string>();

/**
 * Prefetch metadata for unknown assets to avoid missing UI data.
 * Uses the idle queue to run after critical operations complete.
 */
function prefetchMetadataIfMissing(
  id: string,
  address: string,
  setAssetsMetadata?: (metadata: Record<string, AssetMetadata>) => void,
  onMetadataFetched?: () => void
): void {
  if (inFlightMetadata.has(id)) return;
  inFlightMetadata.add(id);

  // Run when client is idle to avoid blocking critical operations
  runWhenClientIdle(async () => {
    try {
      const { base } = await fetchTokenMetadata(id);
      await setTokensBaseMetadata({ [id]: base });
      setAssetsMetadata?.({ [id]: base });
      // Reset deduping timer and trigger immediate refresh
      useWalletStore.setState(state => ({
        balancesLastFetched: { ...state.balancesLastFetched, [address]: 0 }
      }));
      onMetadataFetched?.();
    } finally {
      inFlightMetadata.delete(id);
    }
  });
}

export interface FetchBalancesOptions {
  /** Callback to update asset metadata in the store */
  setAssetsMetadata?: (metadata: Record<string, AssetMetadata>) => void;
  /** Whether to prefetch missing metadata (default: true) */
  prefetchMissingMetadata?: boolean;
  /** Callback to trigger immediate balance refresh after metadata is fetched */
  onMetadataFetched?: () => void;
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
  const { setAssetsMetadata, prefetchMissingMetadata = true, onMetadataFetched } = options;
  const balances: TokenBalanceData[] = [];

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

  // First pass: prefetch missing metadata
  if (prefetchMissingMetadata) {
    for (const asset of assets) {
      const id = getBech32AddressFromAccountId(asset.faucetId());
      if (id !== midenFaucetId && !tokenMetadatas[id]) {
        prefetchMetadataIfMissing(id, address, setAssetsMetadata, onMetadataFetched);
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

    const tokenMetadata = isMiden ? MIDEN_METADATA : tokenMetadatas[tokenId];
    if (!tokenMetadata) {
      // Skip assets without metadata (will be available after prefetch)
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
