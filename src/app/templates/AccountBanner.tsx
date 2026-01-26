import React, { HTMLAttributes, memo, ReactNode, useMemo } from 'react';

import classNames from 'clsx';

import AddressShortView from 'app/atoms/AddressShortView';
import Name from 'app/atoms/Name';
import { Icon, IconName } from 'app/icons/v2';
import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { useNetwork } from 'lib/miden/front';
import { accountIdStringToSdk, getBech32AddressFromAccountId } from 'lib/miden/sdk/helpers';
import { WalletAccount } from 'lib/shared/types';

type AccountBannerProps = HTMLAttributes<HTMLDivElement> & {
  account?: WalletAccount;
  displayBalance?: boolean;
  networkRpc?: string;
  label?: ReactNode;
  labelDescription?: ReactNode;
  labelIndent?: 'sm' | 'md';
};

const AccountBanner = memo<AccountBannerProps>(({ className, account }) => {
  const network = useNetwork();

  const displayAddress = useMemo(
    () =>
      account?.accountId ? getBech32AddressFromAccountId(accountIdStringToSdk(account.accountId), network.id) : '',
    [account?.accountId, network.id]
  );

  return (
    <div className={classNames('flex flex-col mt-4', className)}>
      <div className={classNames('w-full', 'border border-gray-100 rounded-2xl', 'p-4', 'flex items-center')}>
        <Icon name={IconName.Wallet} fill="black" size="sm" />

        <div className="flex items-center ml-3 text-sm">
          <Name className="text-gray-600 mr-3">{account!.name}</Name>
          <AddressShortView address={displayAddress} />
        </div>
      </div>
    </div>
  );
});

export default AccountBanner;
