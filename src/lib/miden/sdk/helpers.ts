import { AccountId, Address, NetworkId } from '@miden-sdk/miden-sdk';

export function getBech32AddressFromAccountId(accountId: AccountId): string {
  const accountAddress = Address.fromAccountId(accountId, 'BasicWallet');
  return accountAddress.toBech32(NetworkId.Testnet);
}

export function accountIdStringToSdk(accountId: string): AccountId {
  const accountAddress = Address.fromBech32(accountId);
  return accountAddress.accountId();
}
