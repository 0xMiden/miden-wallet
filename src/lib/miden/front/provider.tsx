import React, { FC, useEffect, useMemo } from 'react';

import { FiatCurrencyProvider } from 'lib/fiat-curency';
import { MidenContextProvider, useMidenContext } from 'lib/miden/front/client';
import { ReadyMidenProvider } from 'lib/miden/front/ready';
import { PropsWithChildren } from 'lib/props-with-children';

import { getMidenClient } from '../sdk/miden-client';
import { TokensMetadataProvider } from './assets';

// TODO: This can likely be a more general wallet state provider, rather than just for Miden
export const MidenProvider: FC<PropsWithChildren> = ({ children }) => {
  // Eagerly initialize the Miden client singleton when the app starts
  useEffect(() => {
    const initializeClient = async () => {
      try {
        await getMidenClient();
      } catch (err) {
        console.error('Failed to initialize Miden client singleton:', err);
      }
    };
    initializeClient();
  }, []);

  return (
    <MidenContextProvider>
      <ConditionalReadyMiden>{children}</ConditionalReadyMiden>
    </MidenContextProvider>
  );
};

const ConditionalReadyMiden: FC<PropsWithChildren> = ({ children }) => {
  const { ready } = useMidenContext();

  return useMemo(
    () =>
      ready ? (
        <ReadyMidenProvider>
          <TokensMetadataProvider>
            <FiatCurrencyProvider>{children}</FiatCurrencyProvider>
          </TokensMetadataProvider>
        </ReadyMidenProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};
