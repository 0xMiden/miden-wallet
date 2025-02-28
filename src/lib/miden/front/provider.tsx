import React, { FC, useMemo } from 'react';

import { FiatCurrencyProvider } from 'lib/fiat-curency';
import { MidenContextProvider, useMidenContext } from 'lib/miden/front/client';
import { ReadyMidenProvider } from 'lib/miden/front/ready';
import { PropsWithChildren } from 'lib/props-with-children';

import { TokensMetadataProvider } from './assets';
import { FungibleTokensBalancesProvider } from './fungible-tokens-balances';

// TODO: This can likely be a more general wallet state provider, rather than just for Miden
export const MidenProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <MidenContextProvider>
      <ConditionalReadyLeo>{children}</ConditionalReadyLeo>
    </MidenContextProvider>
  );
};

const ConditionalReadyLeo: FC<PropsWithChildren> = ({ children }) => {
  const { ready } = useMidenContext();

  return useMemo(
    () =>
      ready ? (
        <ReadyMidenProvider>
          <TokensMetadataProvider>
            <FiatCurrencyProvider>
              <FungibleTokensBalancesProvider>{children}</FungibleTokensBalancesProvider>
            </FiatCurrencyProvider>
          </TokensMetadataProvider>
        </ReadyMidenProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};
