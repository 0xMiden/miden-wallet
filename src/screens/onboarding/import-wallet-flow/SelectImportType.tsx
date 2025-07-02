import React, { useMemo } from 'react';

import classNames from 'clsx';

import { ReactComponent as ArrowRightIcon } from 'app/icons/arrow-right.svg';

import { ImportType } from '../types';

export interface SelectImportTypeScreenProps extends Omit<React.ButtonHTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  onSubmit?: (payload: ImportType) => void;
}

type ImportTypeOption = {
  id: ImportType;
  title: string;
  description: string;
  isLast?: boolean;
};

export const SelectImportTypeScreen = ({ onSubmit, ...props }: SelectImportTypeScreenProps) => {
  const ImportTypeOptions: ImportTypeOption[] = useMemo(
    () => [
      {
        id: ImportType.SeedPhrase,
        title: 'Import with Seed Phrase',
        description: 'Use an existing 12 word recovery phrase. You can also import wallets from other wallet providers.'
      },
      {
        id: ImportType.WalletFile,
        title: 'Import with Encrypted Wallet File',
        description: 'Upload your encrypted wallet file to securetly restore your account.',
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
          Select a method to securely restore your existing wallet and regain access to your account
        </p>
      </div>
      {ImportTypeOptions.map(option => (
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
    </div>
  );
};
