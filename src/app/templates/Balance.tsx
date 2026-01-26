import React, { cloneElement, memo, ReactElement, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { useAccount, useAllBalances, useAllTokensBaseMetadata, useNetwork } from 'lib/miden/front';
import { getBech32AddressFromAccountId } from 'lib/miden/sdk/helpers';

type BalanceProps = {
  children: (b: BigNumber) => ReactElement;
};

const Balance = memo<BalanceProps>(({ children }) => {
  const account = useAccount();
  const allTokensBaseMetadata = useAllTokensBaseMetadata();
  const network = useNetwork();
  const address = useMemo(() => {
    return getBech32AddressFromAccountId(account.accountId, network.id);
  }, [account.accountId, network.id]);
  const { data: allTokenBalances = [] } = useAllBalances(address, allTokensBaseMetadata);

  return useMemo(() => {
    const childNode = children(new BigNumber(allTokenBalances.reduce((sum, token) => sum + token.balance, 0)));
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
  }, [children, allTokenBalances]);
});

export default Balance;
