import BigNumber from 'bignumber.js';

import { isPositiveNumber, toTokenId, tryParseTokenTransfers } from './helpers';

describe('activity/helpers', () => {
  describe('isPositiveNumber', () => {
    it('returns true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(100)).toBe(true);
      expect(isPositiveNumber(0.001)).toBe(true);
      expect(isPositiveNumber('42')).toBe(true);
      expect(isPositiveNumber(new BigNumber(999))).toBe(true);
    });

    it('returns false for zero', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber('0')).toBe(false);
      expect(isPositiveNumber(new BigNumber(0))).toBe(false);
    });

    it('returns false for negative numbers', () => {
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-100)).toBe(false);
      expect(isPositiveNumber('-42')).toBe(false);
      expect(isPositiveNumber(new BigNumber(-999))).toBe(false);
    });
  });

  describe('toTokenId', () => {
    it('returns contract_tokenId format', () => {
      expect(toTokenId('contract123')).toBe('contract123_0');
      expect(toTokenId('contract123', 0)).toBe('contract123_0');
      expect(toTokenId('contract123', 42)).toBe('contract123_42');
      expect(toTokenId('contract123', '99')).toBe('contract123_99');
    });

    it('handles various contract addresses', () => {
      expect(toTokenId('KT1abc', 1)).toBe('KT1abc_1');
      expect(toTokenId('0x123', 100)).toBe('0x123_100');
    });
  });

  describe('tryParseTokenTransfers', () => {
    it('parses FA1.2 transfer parameters', () => {
      const onTransfer = jest.fn();
      const parameters = {
        entrypoint: 'transfer',
        value: {
          args: [
            { string: 'sender-address' },
            {
              args: [{ string: 'recipient-address' }, { int: '1000' }]
            }
          ]
        }
      };

      tryParseTokenTransfers(parameters, 'contract-address', onTransfer);

      expect(onTransfer).toHaveBeenCalledWith(
        'contract-address_0',
        'sender-address',
        'recipient-address',
        '1000'
      );
    });

    it('parses FA2 transfer parameters', () => {
      const onTransfer = jest.fn();
      const parameters = {
        entrypoint: 'transfer',
        value: [
          {
            args: [
              { string: 'sender-address' },
              [
                {
                  args: [
                    { string: 'recipient-address' },
                    {
                      args: [{ int: '5' }, { int: '2000' }]
                    }
                  ]
                }
              ]
            ]
          }
        ]
      };

      tryParseTokenTransfers(parameters, 'contract-address', onTransfer);

      expect(onTransfer).toHaveBeenCalledWith(
        'contract-address_5',
        'sender-address',
        'recipient-address',
        '2000'
      );
    });

    it('does not call onTransfer for non-transfer entrypoints', () => {
      const onTransfer = jest.fn();
      const parameters = {
        entrypoint: 'approve',
        value: {}
      };

      tryParseTokenTransfers(parameters, 'contract-address', onTransfer);

      expect(onTransfer).not.toHaveBeenCalled();
    });

    it('handles malformed parameters gracefully', () => {
      const onTransfer = jest.fn();

      // Should not throw
      expect(() => {
        tryParseTokenTransfers(null, 'contract', onTransfer);
      }).not.toThrow();

      expect(() => {
        tryParseTokenTransfers({}, 'contract', onTransfer);
      }).not.toThrow();

      expect(() => {
        tryParseTokenTransfers({ entrypoint: 'transfer' }, 'contract', onTransfer);
      }).not.toThrow();

      expect(onTransfer).not.toHaveBeenCalled();
    });

    it('handles incomplete FA1.2 parameters', () => {
      const onTransfer = jest.fn();
      const parameters = {
        entrypoint: 'transfer',
        value: {
          args: [
            { string: 'sender-address' },
            {
              args: [{ notString: 'invalid' }, { int: '1000' }]
            }
          ]
        }
      };

      tryParseTokenTransfers(parameters, 'contract-address', onTransfer);

      // Should not call because 'to' is missing
      expect(onTransfer).not.toHaveBeenCalled();
    });
  });
});
