import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';

interface PreviewTransactionAmountProps {
  amount: BigNumber;
  assetSymbol: string;
}

const PreviewTransactionAmount: FC<PreviewTransactionAmountProps> = ({ amount, assetSymbol }) => {
  const { integer, decimals } = useMemo(() => {
    const integer = amount.integerValue(BigNumber.ROUND_FLOOR).toNumber();
    const decimals = amount.minus(integer).toNumber();
    return { integer, decimals };
  }, [amount]);

  return (
    <div className="flex flex-col mx-auto items-center mt-8 mb-4">
      <div className="flex flex-row items-end">
        <span className="font-bold text-4xl leading-none">{integer}</span>
        {decimals > 0 && <span className="font-semibold text-xl leading-tight">{decimals.toString().slice(1)}</span>}
      </div>
      <span className="text-lg text-gray-400">{assetSymbol}</span>
    </div>
  );
};

export default PreviewTransactionAmount;
