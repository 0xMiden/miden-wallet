import React, { FC, PropsWithChildren, Suspense } from 'react';

import { useIntercomSync } from './hooks/useIntercomSync';
import { usePrefetchBalances } from './hooks/usePrefetchBalances';

/**
 * Provider component that sets up the Zustand store synchronization with the backend.
 * This should wrap the main app to ensure the store stays in sync.
 */
export const WalletStoreProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <Suspense fallback={<WalletStoreLoading />}>
      <WalletStoreSyncSetup>{children}</WalletStoreSyncSetup>
    </Suspense>
  );
};

/**
 * Inner component that sets up sync and renders children when ready
 */
const WalletStoreSyncSetup: FC<PropsWithChildren> = ({ children }) => {
  const isInitialized = useIntercomSync();

  // Prefetch balances as soon as store is initialized
  usePrefetchBalances();

  if (!isInitialized) {
    return <WalletStoreLoading />;
  }

  return <>{children}</>;
};

/**
 * Loading fallback component
 */
const WalletStoreLoading: FC = () => {
  return null; // The app already has loading UI via Suspense boundaries
};

export default WalletStoreProvider;
