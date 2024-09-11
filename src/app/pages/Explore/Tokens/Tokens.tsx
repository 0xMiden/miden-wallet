import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { useSWRConfig } from 'swr';
import { useDebounce } from 'use-debounce';

import Money from 'app/atoms/Money';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { AssetIcon } from 'app/templates/AssetIcon';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { ALEO_SLUG, ALEO_TOKEN_ID } from 'lib/miden/assets/constants';
import {
  useAccount,
  useBalanceSWRKey,
  useDisplayedFungibleTokens,
  useAssetMetadata,
  getAssetSymbol,
  useAllTokensBaseMetadata,
  searchAssets
} from 'lib/miden/front';
import { useFungibleTokensBalances } from 'lib/miden/front/fungible-tokens-balances';
import { T } from 'lib/i18n/react';
import { useIntersectionDetection } from 'lib/ui/use-intersection-detection';
import { Link, navigate } from 'lib/woozie';

import { AssetsSelectors } from '../Assets.selectors';
import { AleoToken } from './AleoToken';

const Tokens: FC = () => {
  const account = useAccount();
  const address = account.publicKey;

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const canLoadMore = useRef(false);

  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const { assets, latestBalances } = useMemo(() => {
    const assets = [{ slug: ALEO_SLUG, id: ALEO_TOKEN_ID }];
    const balances: Record<string, string> = {};

    canLoadMore.current = true;

    return { assets: assets, latestBalances: balances };
  }, [allTokensBaseMetadata]);

  const searchValue = '';
  const searchFocused = false;
  const [activeIndex, setActiveIndex] = useState(0);

  const searchValueExist = useMemo(() => Boolean(searchValue), [searchValue]);
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const filteredAssets = useMemo(
    () => searchAssets(searchValueDebounced, assets, allTokensBaseMetadata),
    [searchValueDebounced, assets, allTokensBaseMetadata]
  );

  const activeAsset = useMemo(() => {
    return searchFocused && searchValueExist && filteredAssets[activeIndex] ? filteredAssets[activeIndex] : null;
  }, [filteredAssets, searchFocused, searchValueExist, activeIndex]);

  useEffect(() => {
    if (activeIndex !== 0 && activeIndex >= filteredAssets.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredAssets.length]);

  useEffect(() => {
    if (!activeAsset) return;

    const handleKeyup = (evt: KeyboardEvent) => {
      switch (evt.key) {
        case 'Enter':
          navigate(toExploreAssetLink(activeAsset.id));
          break;

        case 'ArrowDown':
          setActiveIndex(i => i + 1);
          break;

        case 'ArrowUp':
          setActiveIndex(i => (i > 0 ? i - 1 : 0));
          break;
      }
    };

    window.addEventListener('keyup', handleKeyup);
    return () => window.removeEventListener('keyup', handleKeyup);
  }, [activeAsset, setActiveIndex]);

  const handleLoadItems = () => {};

  const handleIntersection = useCallback(() => {}, [handleLoadItems]);

  useIntersectionDetection(loadMoreRef, handleIntersection);

  return (
    <div className={classNames('w-full')}>
      {filteredAssets.length > 0 ? (
        <div
          className={classNames(
            'w-full overflow-hidden',
            'rounded-sm bg-white',
            'flex flex-col',
            'text-black text-sm leading-tight'
          )}
        >
          <TransitionGroup key={'chainId'}>
            {filteredAssets.map(asset => {
              const active = activeAsset ? asset === activeAsset : false;

              return (
                <CSSTransition
                  key={asset.slug}
                  timeout={300}
                  classNames={{
                    enter: 'opacity-0',
                    enterActive: classNames('opacity-100', 'transition ease-out duration-300'),
                    exit: classNames('opacity-0', 'transition ease-in duration-300')
                  }}
                  unmountOnExit
                >
                  <ListItem
                    assetSlug={asset.slug}
                    assetId={asset.id}
                    active={active}
                    accountPublicKey={account.publicKey}
                    latestBalance={latestBalances[asset.slug]}
                  />
                </CSSTransition>
              );
            })}
          </TransitionGroup>
        </div>
      ) : (
        <div className={classNames('my-8', 'flex flex-col items-center justify-center', 'text-gray-500')}>
          <p className={classNames('mb-2', 'flex items-center justify-center', 'text-black text-black ')}>
            {searchValueExist && <SearchIcon className="w-5 h-auto mr-1 stroke-current" />}

            <span>
              <T id="noAssetsFound" />
            </span>
          </p>

          <p className={classNames('text-center text-xs ')}>
            <T
              id="ifYouDontSeeYourAsset"
              substitutions={[
                <b>
                  <T id="manage" />
                </b>
              ]}
            />
          </p>
        </div>
      )}
      {<div ref={loadMoreRef} className="w-full flex justify-center"></div>}
    </div>
  );
};

export default Tokens;

type ListItemProps = {
  assetSlug: string;
  assetId: string;
  active: boolean;
  accountPublicKey: string;
  latestBalance?: string;
};

const ListItem = memo<ListItemProps>(({ assetSlug, assetId, active, accountPublicKey, latestBalance }) => {
  const { cache } = useSWRConfig();

  const metadata = useAssetMetadata(assetSlug, assetId);

  const balanceSWRKey = useBalanceSWRKey(assetSlug, accountPublicKey, true, true, false);
  const balanceAlreadyLoaded = useMemo(() => cache.get(balanceSWRKey) !== undefined, [cache, balanceSWRKey]);

  const toDisplayRef = useRef<HTMLDivElement>(null);
  const [displayed, setDisplayed] = useState(balanceAlreadyLoaded);

  const handleIntersection = useCallback(() => {
    setDisplayed(true);
  }, [setDisplayed]);

  useIntersectionDetection(toDisplayRef, handleIntersection, !displayed);

  const renderBalanceInToken = useCallback(
    (balance: BigNumber) => (
      <div
        className="truncate font-medium text-black text-right ml-4 flex-1 flex justify-end"
        style={{ fontSize: '14px', lineHeight: '20px' }}
      >
        <Money smallFractionFont={false}>{balance}</Money>
      </div>
    ),
    []
  );

  const renderBalanceInFiat = useCallback(
    (balance: BigNumber) => {
      return (
        <InFiat assetSlug={assetSlug} volume={balance} smallFractionFont={false}>
          {({ balance, symbol }) => (
            <div
              className={classNames('ml-1', 'font-normal text-md flex justify-end  truncate text-right')}
              style={{ color: '#59657C' }}
            >
              <span className="mr-1">≈</span>
              <span>{symbol}</span>
              {balance}
            </div>
          )}
        </InFiat>
      );
    },
    [assetSlug]
  );

  return (
    <Link
      to={toExploreAssetLink(assetId)}
      className={classNames(
        'mt-2 p-2 border border-gray-600 rounded-lg',
        'relative',
        'block w-full',
        'overflow-hidden',
        active ? 'bg-gray-100' : 'hover:bg-gray-100 focus:bg-gray-100',
        'flex items-center py-2',
        'text-black',
        'transition ease-in-out duration-200',
        'focus:outline-none'
      )}
      testID={AssetsSelectors.AssetItemButton}
      testIDProperties={{ key: assetSlug }}
    >
      <AssetIcon
        assetSlug={assetSlug}
        assetId={assetId}
        size={assetSlug === ALEO_SLUG ? 14 : 34}
        className="mr-2 flex-shrink-0"
      />

      <div ref={toDisplayRef} className={classNames('w-full', 'flex justify-between')}>
        <div className="flex justify-between w-full mb-1">
          <div className="flex items-center flex-initial">
            <div className={classNames('font-semibold')} style={{ fontSize: '14px', lineHeight: '20px' }}>
              {getAssetSymbol(metadata)}
            </div>
            {assetSlug === ALEO_SLUG && <AleoToken />}
          </div>
        </div>
        <div className="flex flex-col justify-between w-full mb-1">
          <Balance address={accountPublicKey} assetSlug={assetSlug} assetId={assetId} displayed={displayed}>
            {renderBalanceInToken}
          </Balance>
          <Balance address={accountPublicKey} assetSlug={assetSlug} assetId={assetId} displayed={displayed}>
            {renderBalanceInFiat}
          </Balance>
        </div>
      </div>
    </Link>
  );
});

function toExploreAssetLink(assetId: string) {
  return assetId === ALEO_TOKEN_ID ? '/tokens/aleo' : `/tokens/${assetId}`;
}
