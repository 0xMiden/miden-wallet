import React, { FC, useMemo } from 'react';

import { MidenClientProvider, useMidenClient } from 'lib/miden/front/client';
import { ReadyAleoProvider } from 'lib/miden/front/ready';
import { FiatCurrencyProvider } from 'lib/fiat-curency';
import { PropsWithChildren } from 'lib/props-with-children';

import { TokensMetadataProvider } from './assets';
import { FungibleTokensBalancesProvider } from './fungible-tokens-balances';

export const AleoProvider: FC<PropsWithChildren> = ({ children }) => {
  console.log('inside aleoProvider');
  return (
    <MidenClientProvider>
      <ConditionalReadyLeo>{children}</ConditionalReadyLeo>
    </MidenClientProvider>
  );
};

const ConditionalReadyLeo: FC<PropsWithChildren> = ({ children }) => {
  const ready = true;
  console.log('inside ConditionalReadyLeo');

  return useMemo(
    () =>
      ready ? (
        <ReadyAleoProvider>
          <TokensMetadataProvider>
            <FiatCurrencyProvider>
              <FungibleTokensBalancesProvider>{children}</FungibleTokensBalancesProvider>
            </FiatCurrencyProvider>
          </TokensMetadataProvider>
        </ReadyAleoProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};
