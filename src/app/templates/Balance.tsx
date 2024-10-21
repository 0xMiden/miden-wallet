import React, { cloneElement, memo, ReactElement, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { ALEO_SLUG, ALEO_TOKEN_ID } from 'lib/miden/assets/constants';
import { useAccount, useBalance } from 'lib/miden/front';

type BalanceProps = {
  children: (b: BigNumber) => ReactElement;
};

const Balance = memo<BalanceProps>(({ children }) => {
  const account = useAccount();
  const { data: balance } = useBalance(account.publicKey, '0x2526b867beb537ca');
  console.log('inside the Balance component');
  console.log(balance?.toNumber());

  return useMemo(() => {
    const childNode = children(balance !== undefined ? balance : new BigNumber(0));
    const exist = true;

    return (
      <CSSTransition
        in={exist}
        timeout={200}
        classNames={{
          enter: 'opacity-0',
          enterActive: classNames('opacity-100', 'transition ease-out duration-200'),
          exit: classNames('opacity-0', 'transition ease-in duration-200')
        }}
      >
        {cloneElement(childNode, {
          className: classNames(childNode.props.className, !exist && 'invisible')
        })}
      </CSSTransition>
    );
  }, [children, balance]);
});

export default Balance;
