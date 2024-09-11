import BigNumber from 'bignumber.js';

import * as Repo from 'lib/miden/repo';

export async function getPublicTokenBalance(
  chainId: string,
  account: string,
  symbol: string,
  tokenId: string,
  fetcher: () => Promise<bigint>
) {
  const accountTokenKey = Repo.toAccountTokenKey(chainId, account, tokenId);
  const accountToken = await Repo.accountTokens.get(accountTokenKey);
  if (!accountToken) {
    await Repo.accountTokens.put(
      {
        type: Repo.ITokenType.Fungible,
        chainId,
        account,
        tokenSlug: symbol,
        tokenId: tokenId,
        status: Repo.ITokenStatus.Enabled,
        latestBalance: '0',
        addedAt: Date.now()
      },
      accountTokenKey
    );
  }

  let balance = accountToken?.latestBalance ? BigInt(accountToken.latestBalance) : BigInt(0);
  try {
    const getPublicBalancePromise = fetcher().then(async newBalance => {
      await Repo.accountTokens.put(
        {
          type: Repo.ITokenType.Fungible,
          chainId,
          account,
          tokenSlug: symbol,
          tokenId: tokenId,
          status: Repo.ITokenStatus.Enabled,
          latestBalance: newBalance.toString(),
          addedAt: accountToken?.addedAt ?? Date.now()
        },
        accountTokenKey
      );
      return newBalance;
    });
    if (!accountToken) {
      balance = await getPublicBalancePromise;
    }
  } catch (err: any) {
    console.log('Error fetching balance', err);
  }

  return balance;
}

export async function setTokenStatus(
  type: Repo.ITokenType,
  chainId: string,
  account: string,
  tokenSlug: string,
  tokenId: string,
  status: Repo.ITokenStatus
) {
  const repoKey = Repo.toAccountTokenKey(chainId, account, tokenId);
  const existing = await Repo.accountTokens.get(repoKey);

  return Repo.accountTokens.put(
    {
      ...(existing ?? {
        type,
        chainId,
        account,
        tokenSlug,
        tokenId,
        addedAt: Date.now()
      }),
      status
    },
    repoKey
  );
}

export async function fetchDisplayedFungibleTokens(chainId: string, account: string) {
  return Repo.accountTokens
    .where({ type: Repo.ITokenType.Fungible, chainId, account })
    .filter(isTokenDisplayed)
    .sortBy('order')
    .then(items => items);
}

export async function fetchFungibleTokens(chainId: string, account: string) {
  return Repo.accountTokens.where({ type: Repo.ITokenType.Fungible, chainId, account }).toArray();
}

export async function fetchCollectibleTokens(chainId: string, account: string, isDisplayed: boolean) {
  return Repo.accountTokens
    .where({ type: Repo.ITokenType.Collectible, chainId, account })
    .filter(accountToken => (isDisplayed ? isTokenDisplayed(accountToken) : true))
    .sortBy('order');
}

export async function fetchAllKnownFungibleTokenSlugs(chainId: string) {
  const allAccountTokens = await Repo.accountTokens.where({ type: Repo.ITokenType.Fungible, chainId }).toArray();

  return Array.from(new Set(allAccountTokens.map(t => t.tokenSlug)));
}

export async function fetchAllKnownCollectibleTokenSlugs(chainId: string) {
  const allAccountTokens = await Repo.accountTokens.where({ type: Repo.ITokenType.Collectible, chainId }).toArray();

  return Array.from(new Set(allAccountTokens.map(t => t.tokenSlug)));
}

export function isTokenDisplayed(t: Repo.IAccountToken) {
  return (
    t.status === Repo.ITokenStatus.Enabled ||
    (t.status === Repo.ITokenStatus.Idle && new BigNumber(t.latestBalance!).isGreaterThan(0))
  );
}
