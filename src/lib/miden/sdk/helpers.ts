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

export function getBech32AddressFromAccountId(accountId: AccountId | string, network: MIDEN_NETWORK_NAME): string {
  if (typeof accountId === 'string') {
    accountId = AccountId.fromHex(accountId);
  }
  const accountAddress = Address.fromAccountId(accountId, 'BasicWallet');
  return accountAddress.toBech32(networkToNetworkId(network));
}

export function accountIdStringToSdk(accountId: string): AccountId {
  return AccountId.fromHex(accountId);
}

export function ensureAccountIds(accountIds: string[]): AccountId[] {
  return accountIds.map(id => {
    try {
      return AccountId.fromHex(id);
    } catch (e) {
      // it should be a bech32 address
      const address = Address.fromBech32(id);
      return address.accountId();
    }
  });
}
