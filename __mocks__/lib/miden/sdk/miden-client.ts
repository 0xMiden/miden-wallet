export const getMidenClient = async () => ({
  free() {},
  importPublicMidenWalletFromSeed: async () => 'miden-account-1',
  createMidenWallet: async () => 'miden-account-1',
  getAccounts: async () => [],
  getAccount: async () => null,
  syncState: async () => ({ blockNum: () => 1 })
});

// Mock withWasmClientLock to just execute the operation directly
export const withWasmClientLock = async <T>(operation: () => Promise<T>): Promise<T> => {
  return operation();
};
