import React, { cloneElement, memo, ReactElement, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { MidenTokens, TOKEN_MAPPING } from 'lib/miden-chain/constants';
import { useAccount, useBalance } from 'lib/miden/front';

type BalanceProps = {
  children: (b: BigNumber) => ReactElement;
};

const Balance = memo<BalanceProps>(({ children }) => {
  const account = useAccount();
  const { data: balance } = useBalance(account.publicKey, TOKEN_MAPPING[MidenTokens.Miden].faucetId);

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
