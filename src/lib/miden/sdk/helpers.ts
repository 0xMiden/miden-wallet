import { AccountId, Address, NetworkId } from '@miden-sdk/miden-sdk';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';

export function networkToNetworkId(network: MIDEN_NETWORK_NAME): NetworkId {
  switch (network) {
    case MIDEN_NETWORK_NAME.TESTNET:
      return NetworkId.testnet();
    case MIDEN_NETWORK_NAME.DEVNET:
      return NetworkId.devnet();
    case MIDEN_NETWORK_NAME.LOCALNET:
      return NetworkId.custom('mlcl');
    default:
      throw new Error(`Unsupported network: ${network}`);
  }
}

export function getBech32AddressFromAccountId(accountId: AccountId, network: MIDEN_NETWORK_NAME): string {
  const accountAddress = Address.fromAccountId(accountId, 'BasicWallet');
  return accountAddress.toBech32(networkToNetworkId(network));
}

export function accountIdStringToSdk(accountId: string): AccountId {
  return AccountId.fromHex(accountId);
}
