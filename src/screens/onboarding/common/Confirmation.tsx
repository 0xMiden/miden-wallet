import React from 'react';

import { useTranslation } from 'react-i18next';

import { IconName } from 'app/icons/v2';
import { Button } from 'components/Button';
import { Message } from 'components/Message';

export interface ConfirmationScreenProps extends React.ButtonHTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  onSubmit?: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ className, isLoading, onSubmit, ...props }) => {
  const { t } = useTranslation();

  return (
    <div {...props} className="flex-1 flex flex-col h-full justify-between bg-white px-10 py-6 gap-y-8">
      <div className="flex flex-col items-center justify-center flex-grow">
        <Message
          icon={IconName.Success}
          iconSize="3xl"
          iconClassName="mb-8"
          title={t('yourWalletIsReady')}
          description={t('explorePrivateAssets')}
        />
        <div className="flex items-center justify-center gap-x-1" />
      </div>
      <div className="flex mt-auto justify-center">
        <Button
          tabIndex={0}
          autoFocus
          title={t('getStarted')}
          className="w-[360px] self-center"
          onClick={onSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
