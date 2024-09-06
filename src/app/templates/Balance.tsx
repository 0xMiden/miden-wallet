import React, { cloneElement, memo, ReactElement, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { ALEO_SLUG, ALEO_TOKEN_ID } from 'lib/aleo/assets/constants';
import { useAccount, useBalance } from 'lib/aleo/front';

type BalanceProps = {
  address: string;
  children: (b: BigNumber) => ReactElement;
  assetSlug?: string;
  assetId?: string;
  networkRpc?: string;
  displayed?: boolean;
  initial?: BigNumber;
};

const Balance = memo<BalanceProps>(
  ({ address, children, assetSlug = ALEO_SLUG, assetId = ALEO_TOKEN_ID, networkRpc, displayed, initial }) => {
    const account = useAccount();

    return useMemo(() => {
      const childNode = children(new BigNumber(0));
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
    }, [children]);
  }
);

export default Balance;
