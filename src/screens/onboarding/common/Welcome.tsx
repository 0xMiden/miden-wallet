import React from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Message } from 'components/Message';

export interface WelcomeScreenProps extends Omit<React.ButtonHTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  onSubmit?: (action: Actions) => void;
}

export type Actions = 'create' | 'import';

export const WelcomeScreen = ({ className, onSubmit, ...props }: WelcomeScreenProps) => {
  const { t } = useTranslation();
  return (
    <div className={classNames('flex-1', 'flex flex-col items-center', 'bg-white gap-8 p-6', className)} {...props}>
      <Message
        icon={IconName.LeoLock}
        title={t('walletBuiltForPrivacy')}
        description={t('privateTransactionsAnytimeAnywhere')}
      />

      <div className="w-[360px] flex flex-col gap-2">
        <Button title={t('createANewWallet')} onClick={() => onSubmit?.('create')} />
        <Button
          id={'import-link'}
          title={t('iAlreadyHaveAWallet')}
          variant={ButtonVariant.Ghost}
          onClick={() => onSubmit?.('import')}
        />
      </div>
    </div>
  );
};
