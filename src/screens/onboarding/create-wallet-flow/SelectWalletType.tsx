import React, { useMemo } from 'react';

import classNames from 'clsx';

import { ReactComponent as ArrowRightIcon } from 'app/icons/arrow-right.svg';
import { Alert, AlertVariant } from 'components/Alert';

import { WalletType } from '../types';

export interface SelectWalletTypeScreenProps extends Omit<React.ButtonHTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  onSubmit?: (payload: WalletType) => void;
}

type WalletTypeOption = {
  id: WalletType;
  title: string;
  description: string;
  isLast?: boolean;
};

export const SelectWalletTypeScreen = ({ onSubmit, ...props }: SelectWalletTypeScreenProps) => {
  const WalletTypeOptions: WalletTypeOption[] = useMemo(
    () => [
      {
        id: WalletType.OnChain,
        title: 'On-chain Account (Public)',
        description: 'Use an existing 12 word recovery phrase. You can also import wallets from other wallet providers.'
      },
      {
        id: WalletType.OffChain,
        title: 'Off-chain Account (Private)',
        description: 'Fast, private operations with minimal fees, bypassing direct blockchain interaction.',
        isLast: true
      }
    ],
    []
  );

  return (
    <div className="flex-1 flex flex-col items-center bg-transparent p-8 h-full">
      <div className="flex flex-col items-center w-4/5 pb-8">
        <h1 className="font-semibold text-2xl lh-title">Choose Your Account Type</h1>
        <p className="text-base text-center lh-title">
          Select how you want to interact with the blockchain -- on-chain or off-chain.
        </p>
      </div>
      {WalletTypeOptions.map(option => (
        <div
          key={option.id}
          className={classNames(
            'flex flex-col border w-3/5 p-4 rounded-lg cursor-pointer',
            { 'mb-2': !option.isLast },
            { 'mb-8': option.isLast }
          )}
          onClick={() => onSubmit?.(option.id)}
        >
          <div className="flex flex-row justify-between items-center">
            <h2 className="font-medium text-base">{option.title}</h2>
            <ArrowRightIcon fill="black" height={'20px'} width={'20px'} />
          </div>
          <p className="text-grey-600">{option.description}</p>
        </div>
      ))}
      <Alert
        variant={AlertVariant.Info}
        title="You can add and manage multiple account types later within the wallet."
      />
    </div>
  );
};
