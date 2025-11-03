import { AccountId, Address, NetworkId } from '@demox-labs/miden-sdk';

export function getBech32AddressFromAccountId(accountId: AccountId): string {
  const accountAddress = Address.fromAccountId(accountId, 'Unspecified');
  return accountAddress.toBech32(NetworkId.Testnet);
}

export function accountIdStringToSdk(accountId: string): AccountId {
  const accountAddress = Address.fromBech32(accountId);
  return accountAddress.accountId();
}
