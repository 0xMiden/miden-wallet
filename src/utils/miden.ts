export const isValidHexAddress = (address: string) => {
  return address.length === 32 && address.startsWith('0x');
};

const MIDEN_MAINNET_PREFIX = 'mm1';
const MIDEN_TESTNET_PREFIX = 'mtst1';
const MIDEN_BECH32_PREFIXES = [MIDEN_MAINNET_PREFIX, MIDEN_TESTNET_PREFIX];

export const isValidBech32Address = (address: string) => {
  return MIDEN_BECH32_PREFIXES.some(prefix => address.startsWith(prefix) && address.length === prefix.length + 30);
};

export const isValidMidenAddress = (address: string) => {
  return isValidHexAddress(address) || isValidBech32Address(address);
};
