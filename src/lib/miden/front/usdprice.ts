import { useMemo } from 'react';

import constate from 'constate';

import { toTokenSlug } from 'lib/miden/front';
import { useRetryableSWR } from 'lib/swr';

export function useAssetUSDPrice(slug: string) {
  const prices = useUSDPrices();

  return useMemo(() => {
    const rawValue = prices[slug];
    return rawValue ? Number(rawValue) : null;
  }, [slug, prices]);
}

export const [USDPriceProvider, useUSDPrices] = constate((params: { suspense?: boolean }) => {
  const { data } = useRetryableSWR('usd-prices', fetchUSDPrices, {
    refreshInterval: 5 * 60 * 1_000,
    dedupingInterval: 30_000,
    suspense: params.suspense
  });
  return data ?? {};
});

async function fetchUSDPrices() {
  const prices: Record<string, string> = {};

  try {
    // TODO: actually get the rates
    const rates = [{ tokenAddress: '', tokenId: 'aleo', exchangeRate: '1.5' }];
    for (const { tokenAddress, tokenId, exchangeRate } of rates) {
      if (tokenAddress) {
        prices[toTokenSlug(tokenAddress, tokenId)] = exchangeRate;
      } else {
        prices.aleo = exchangeRate;
      }
    }
  } catch {}

  return prices;
}
