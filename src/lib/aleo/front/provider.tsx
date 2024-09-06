import React, { FC, useMemo } from 'react';

import { AleoClientProvider, useAleoClient } from 'lib/aleo/front/client';
import { ReadyAleoProvider } from 'lib/aleo/front/ready';
import { FiatCurrencyProvider } from 'lib/fiat-curency';
import { PropsWithChildren } from 'lib/props-with-children';

import { TokensMetadataProvider } from './assets';
import { FungibleTokensBalancesProvider } from './fungible-tokens-balances';

export const AleoProvider: FC<PropsWithChildren> = ({ children }) => {
  console.log('inside aleoProvider');
  return (
    <AleoClientProvider>
      <ConditionalReadyLeo>{children}</ConditionalReadyLeo>
    </AleoClientProvider>
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
