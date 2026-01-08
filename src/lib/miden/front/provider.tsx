import React, { FC, useEffect, useMemo } from 'react';

import { FiatCurrencyProvider } from 'lib/fiat-curency';
import { MidenContextProvider, useMidenContext } from 'lib/miden/front/client';
import { ReadyMidenProvider } from 'lib/miden/front/ready';
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
        <ConditionalReadyMiden>{children}</ConditionalReadyMiden>
      </MidenContextProvider>
    </WalletStoreProvider>
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
