import React, { FC, useMemo } from 'react';

import { MidenClientProvider, useMidenClient } from 'lib/miden/front/client';
import { ReadyMidenProvider } from 'lib/miden/front/ready';
import { FiatCurrencyProvider } from 'lib/fiat-curency';
import { PropsWithChildren } from 'lib/props-with-children';

import { TokensMetadataProvider } from './assets';
import { FungibleTokensBalancesProvider } from './fungible-tokens-balances';

// TODO: This can likely be a more general wallet state provider, rather than just for Miden
export const MidenProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <MidenClientProvider>
      <ConditionalReadyLeo>{children}</ConditionalReadyLeo>
    </MidenClientProvider>
  );
};

const ConditionalReadyLeo: FC<PropsWithChildren> = ({ children }) => {
  const { ready } = useMidenClient();

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
