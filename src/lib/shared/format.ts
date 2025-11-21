import { formatBigInt } from 'lib/i18n/numbers';
import { ITransactionType } from 'lib/miden/db/types';
import { MIDEN_METADATA } from 'lib/miden/front';

export const formatAmount = (amount: bigint, transactionType: ITransactionType, tokenDecimals: number | undefined) => {
  const normalizedAmount = formatBigInt(amount, tokenDecimals ?? MIDEN_METADATA.decimals);
  if (transactionType === 'send') {
    return `-${normalizedAmount}`;
  } else if (transactionType === 'consume') {
    return `+${normalizedAmount}`;
  }
  return normalizedAmount;
};
