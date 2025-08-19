import React from 'react';

import { useTranslation } from 'react-i18next';

import { IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Message } from 'components/Message';

export interface WelcomeScreenProps extends Omit<React.ButtonHTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  onSubmit?: (action: Actions) => void;
}

export type Actions = 'select-wallet-type' | 'select-import-type';

export const WelcomeScreen = ({ onSubmit, ...props }: WelcomeScreenProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center justify-around bg-transparent gap-8 p-6 h-[calc(100%-64px)]">
      <div className="mt-6">
        <Message
          icon={IconName.WalletWelcome}
          iconSize="5xl"
          iconClassName="mb-10"
          iconBackgroundClassName="!w-64"
          title={t('privacyScalesBetter')}
          description={t('privateTransactionsAnytimeAnywhere')}
        />
      </div>
      <div className="w-[360px] flex flex-col gap-2">
        <Button tabIndex={0} autoFocus title={t('createANewWallet')} onClick={() => onSubmit?.('select-wallet-type')} />
        <Button
          id={'import-link'}
          title={t('iAlreadyHaveAWallet')}
          variant={ButtonVariant.Ghost}
          onClick={() => onSubmit?.('select-import-type')}
        />
      </div>
    </div>
  );
};
