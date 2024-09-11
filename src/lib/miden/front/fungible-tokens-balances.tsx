import constate from 'constate';

import { useInfiniteList } from './use-infinite-list';

export const [FungibleTokensBalancesProvider, useFungibleTokensBalances] = constate(() => {
  return {};
});

// TODO: flesh out these functions
const fetchTokenBalancesCount = async (chainId: string, address: string) => {
  return 5;
};

const fetchTokenBalances = async (chainId: string, address: string, page: number | undefined): Promise<string[]> => {
  return [];
};
