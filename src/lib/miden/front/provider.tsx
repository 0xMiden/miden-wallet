import React, { FC, useEffect, useMemo } from 'react';

import { FiatCurrencyProvider } from 'lib/fiat-curency';
import { MidenContextProvider, useMidenContext } from 'lib/miden/front/client';
import { PropsWithChildren } from 'lib/props-with-children';
import { WalletStoreProvider } from 'lib/store/WalletStoreProvider';

import { getMidenClient } from '../sdk/miden-client';
import { TokensMetadataProvider } from './assets';

/**
 * MidenProvider
 *
 * This provider sets up the wallet state management:
 * - WalletStoreProvider: Initializes Zustand store and syncs with backend
 * - MidenContextProvider: Provides backward-compatible context API
 * - TokensMetadataProvider: Syncs token metadata from storage to Zustand
 * - FiatCurrencyProvider: Provides fiat currency selection (TODO: migrate to Zustand)
 *
 * The Zustand store is the source of truth, and MidenContextProvider
 * now acts as an adapter that exposes the Zustand state via the
 * existing useMidenContext() hook API.
 */
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
    <WalletStoreProvider>
      <MidenContextProvider>
        <ConditionalProviders>{children}</ConditionalProviders>
      </MidenContextProvider>
    </WalletStoreProvider>
  );
};

/**
 * ConditionalProviders - Only renders token/fiat providers when wallet is ready
 *
 * Previously had 5 nested providers, now simplified to 2 (FiatCurrency still uses constate)
 */
const ConditionalProviders: FC<PropsWithChildren> = ({ children }) => {
  const { ready } = useMidenContext();

  return useMemo(
    () =>
      ready ? (
        <TokensMetadataProvider>
          <FiatCurrencyProvider>{children}</FiatCurrencyProvider>
        </TokensMetadataProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};
