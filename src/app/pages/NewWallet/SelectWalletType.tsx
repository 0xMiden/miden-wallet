import React from 'react';

import { useTranslation } from 'react-i18next';

import { IconName } from 'app/icons/v2';
import { Button } from 'components/Button';
import { Message } from 'components/Message';

export interface SelectWalletTypeProps extends Omit<React.ButtonHTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  onSubmit?: (action: Actions) => void;
}

export type Actions = 'select-wallet-type' | 'import';

export const SelectWalletType = ({ onSubmit, ...props }: SelectWalletTypeProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-around bg-transparent gap-8 p-6 h-full">
      <h1 className="font-semibold text-2xl lh-title">Choose Your Account Type</h1>
      <p className="text-base text-center lh-title">
        Select how you want to interact with the blockchain - on-chain or off-chain
      </p>
    </div>
  );
};
