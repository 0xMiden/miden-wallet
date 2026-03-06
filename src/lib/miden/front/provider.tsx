import React, { FC, useEffect, useMemo } from 'react';

import { MidenProvider as SdkMidenProvider } from '@miden-sdk/react';

import { NoteToastProvider } from 'components/NoteToastProvider';
import { TransactionProgressModal } from 'components/TransactionProgressModal';
import { FiatCurrencyProvider } from 'lib/fiat-curency';
import {
  MIDEN_NETWORK_ENDPOINTS,
  MIDEN_NETWORK_NAME,
  MIDEN_NOTE_TRANSPORT_LAYER_ENDPOINTS,
  MIDEN_PROVING_ENDPOINTS
} from 'lib/miden-chain/constants';
import { MidenContextProvider, useMidenContext } from 'lib/miden/front/client';
import { SdkSyncBridge } from 'lib/miden/sdk-bridge/SdkSyncBridge';
import { SyncPauseBridge } from 'lib/miden/sdk-bridge/SyncPauseBridge';
import { VaultSignerProvider } from 'lib/miden/sdk-bridge/VaultSignerProvider';
import { PropsWithChildren } from 'lib/props-with-children';
import { useWalletStore } from 'lib/store';
import { WalletStoreProvider } from 'lib/store/WalletStoreProvider';

import { getMidenClient } from '../sdk/miden-client';
import { TokensMetadataProvider } from './assets';

// Pre-create the modal container to avoid flash when first opening
if (typeof document !== 'undefined' && document.body) {
  let modalRoot = document.getElementById('transaction-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'transaction-modal-root';
    document.body.appendChild(modalRoot);
  }
}

function getSdkProverValue(networkId: string): string {
  // SDK accepts 'testnet', 'devnet', 'local', or a custom URL
  if (networkId === MIDEN_NETWORK_NAME.TESTNET) return 'testnet';
  if (networkId === MIDEN_NETWORK_NAME.DEVNET) return 'devnet';
  return MIDEN_PROVING_ENDPOINTS.get(networkId) ?? 'local';
}

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
        <VaultSignerProvider>
          <NetworkAwareSdkProvider>
            <SdkSyncBridge />
            <SyncPauseBridge />
            <ConditionalProviders>{children}</ConditionalProviders>
            <TransactionProgressModal />
          </NetworkAwareSdkProvider>
        </VaultSignerProvider>
      </MidenContextProvider>
    </WalletStoreProvider>
  );
};

/**
 * NetworkAwareSdkProvider - Wraps SdkMidenProvider with network-reactive config.
 * Reads the selected network from Zustand and derives SDK config accordingly.
 */
const NetworkAwareSdkProvider: FC<PropsWithChildren> = ({ children }) => {
  const selectedNetworkId = useWalletStore(s => s.selectedNetworkId);
  const networkId = selectedNetworkId || MIDEN_NETWORK_NAME.TESTNET;

  const sdkConfig = useMemo(
    () => ({
      rpcUrl: MIDEN_NETWORK_ENDPOINTS.get(networkId) ?? MIDEN_NETWORK_ENDPOINTS.get(MIDEN_NETWORK_NAME.TESTNET)!,
      noteTransportUrl: MIDEN_NOTE_TRANSPORT_LAYER_ENDPOINTS.get(networkId),
      autoSyncInterval: 3000,
      prover: getSdkProverValue(networkId)
    }),
    [networkId]
  );

  return <SdkMidenProvider config={sdkConfig}>{children}</SdkMidenProvider>;
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
          <FiatCurrencyProvider>
            {children}
            {/* NoteToastProvider monitors for new notes and shows toast on mobile */}
            <NoteToastProvider />
          </FiatCurrencyProvider>
        </TokensMetadataProvider>
      ) : (
        <>{children}</>
      ),
    [children, ready]
  );
};
