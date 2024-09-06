import { useMemo } from 'react';

import constate from 'constate';

import { useStorage } from 'lib/aleo/front';
import { useRetryableSWR } from 'lib/swr';

import { FIAT_CURRENCIES } from './consts';
import { ExchangeRateRecord, FiatCurrencyOption } from './types';

// TODO: get price in aleo
// const getFiatCurrencies = buildQuery<{}, CoingeckoFiatInterface>(
//   'GET',
//   `/simple/price?ids=aleo&vs_currencies=${FIAT_CURRENCIES.map(({ apiLabel }) => apiLabel).join(',')}`
// );

const FIAT_CURRENCY_STORAGE_KEY = 'fiat_currency';

export function useAssetFiatCurrencyPrice(slug: string) {
  const exchangeRate = 1; // TODO, fix this
  const exchangeRateAleo = 1; // TODO, fix this
  const { fiatRates, selectedFiatCurrency } = useFiatCurrency();

  return useMemo(() => {
    if (slug !== 'aleo') return 0; // TODO get real fiat rates for other tokens
    if (!fiatRates || !exchangeRate || !exchangeRateAleo) return null;
    const fiatToUsdRate = fiatRates[selectedFiatCurrency.name.toLowerCase()] / exchangeRateAleo;
    const trueExchangeRate = fiatToUsdRate * exchangeRate;
    return trueExchangeRate;
  }, [fiatRates, exchangeRate, exchangeRateAleo, selectedFiatCurrency.name, slug]);
}

export const [FiatCurrencyProvider, useFiatCurrency] = constate((params: { suspense?: boolean }) => {
  const { data } = useRetryableSWR('fiat-currencies', fetchFiatCurrencies, {
    refreshInterval: 5 * 60 * 1_000,
    dedupingInterval: 30_000,
    suspense: params.suspense
  });
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useStorage<FiatCurrencyOption>(
    FIAT_CURRENCY_STORAGE_KEY,
    FIAT_CURRENCIES[0]
  );
  return {
    selectedFiatCurrency,
    setSelectedFiatCurrency,
    fiatRates: data
  };
});

async function fetchFiatCurrencies() {
  // TODO, implement this
  const mappedRates: ExchangeRateRecord = {
    usd: 1
  };

  return mappedRates;
}

export const getFiatCurrencyKey = ({ name }: FiatCurrencyOption) => name;
