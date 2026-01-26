import { Address } from '@miden-sdk/miden-sdk';

import { accountIdStringToSdk, getBech32AddressFromAccountId } from './helpers';

jest.mock('@miden-sdk/miden-sdk', () => ({
  Address: {
    fromAccountId: jest.fn((id: any) => ({
      toBech32: () => `bech32-${id}`
    })),
    fromBech32: jest.fn((addr: string) => ({
      accountId: () => `id-from-${addr}`
    }))
  },
  NetworkId: { Testnet: 'testnet' }
}));

describe('miden sdk helpers', () => {
  it('converts accountId to bech32', () => {
    const res = getBech32AddressFromAccountId('abc' as any);
    expect(Address.fromAccountId).toHaveBeenCalledWith('abc', 'BasicWallet');
    expect(res).toBe('bech32-abc');
  });

  it('parses bech32 into accountId', () => {
    const res = accountIdStringToSdk('bech32');
    expect(Address.fromBech32).toHaveBeenCalledWith('bech32');
    expect(res).toBe('id-from-bech32');
  });
});
