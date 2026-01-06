export const getMidenClient = async () => ({
  free() {},
  importPublicMidenWalletFromSeed: async () => 'miden-account-1',
  createMidenWallet: async () => 'miden-account-1',
  getAccounts: async () => [],
  getAccount: async () => null
});
