import React, { useMemo } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Button } from 'components/Button';
import { Message } from 'components/Message';

export interface ConfirmationScreenProps extends React.ButtonHTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  onSubmit?: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ className, isLoading, onSubmit, ...props }) => {
  const { t } = useTranslation();
  const Checkmarks = useMemo(
    () => [
      {
        title: t('noSeedPhrase'),
        description: t('yourAccountIsProtected')
      },
      {
        title: t('recovery'),
        description: t('downloadAndSecurelyStore')
      }
    ],
    [t]
  );
  return (
    <div {...props} className="flex-1 flex flex-col bg-white px-10 py-6 gap-y-8">
      <Message icon={IconName.CheckboxCircleFill} title={t('yourWalletHasBeenCreated')} description={''} />

      <div className="flex items-center justify-center gap-x-1">
        <Icon name={IconName.MidenLogo} size="md" />
        <h1 className="font-semibold text-lg">polygon</h1>
        <p className="text-lg">Miden</p>
      </div>

      <div className="flex flex-col gap-y-2">
        {Checkmarks.map((c, idx) => (
          <div key={'checkmark-' + c.title + idx} className="flex gap-x-2">
            <div>
              <Icon name={IconName.CheckboxCircleFill} />
            </div>
            <div className="flex flex-col">
              <h1 className="font-semibold text-lg">{c.title}</h1>
              <p className="text-base">{c.description}</p>
            </div>
          </div>
        ))}
      </div>

      <Button title={t('getStarted')} className="w-[360px] self-center" onClick={onSubmit} isLoading={isLoading} />
    </div>
  );
};
