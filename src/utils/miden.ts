export const isHexAddress = (address: string) => {
  return address.startsWith('0x');
};

const MIDEN_MAINNET_PREFIX = 'mm1';
const MIDEN_TESTNET_PREFIX = 'mtst1';
const MIDEN_DEVNET_PREFIX = 'mdev1';
const MIDEN_BECH32_PREFIXES = [MIDEN_MAINNET_PREFIX, MIDEN_TESTNET_PREFIX, MIDEN_DEVNET_PREFIX];

const isValidBech32Address = (address: string) => {
  return MIDEN_BECH32_PREFIXES.some(prefix => address.startsWith(prefix) && address.length === prefix.length + 35);
};

export const isValidMidenAddress = (address: string) => {
  return isValidBech32Address(address);
};
