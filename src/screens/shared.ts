// TODO: Add more here / change
export type EncryptedWalletFile = {
  seedPhrase: string;
  dbContent: string;
};

// Use a constant string to quickly check that the enc/dec works i.e. the password is correct
// without needing to check the whole file
export const ENCRYPTED_WALLET_FILE_PASSWORD_CHECK = 'MidenIsAwesome';
