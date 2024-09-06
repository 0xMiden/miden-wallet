import React, { useMemo } from 'react';

import classNames from 'clsx';

export interface AmountLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  currency?: string;
  amount: string;
}

export const AmountLabel: React.FC<AmountLabelProps> = ({ className, amount, currency, ...props }) => {
  const amountParts = useMemo(() => amount.split('.'), [amount]);

  return (
    <div {...props} className={classNames('flex items-end ', className)}>
      {currency && <span className="text-2xl font-base leading-8">{currency}</span>}
      <p className="text-4xl font-bold leading-10">{amountParts[0]}</p>
      <p className="text-2xl font-bold leading-8">.{amountParts.length > 1 ? amountParts[1] : '00'}</p>
    </div>
  );
};
