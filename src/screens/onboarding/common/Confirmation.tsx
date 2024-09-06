import React, { useMemo } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Message } from 'components/Message';

export interface ConfirmationScreenProps extends React.ButtonHTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  onSubmit?: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ className, isLoading, onSubmit, ...props }) => {
  const { t } = useTranslation();
  const Links = useMemo(
    () => [
      {
        title: t('joinOurDiscord'),
        url: 'https://link.leo.app/discord',
        action: t('join')
      },
      {
        title: t('joinOurTwitter'),
        url: 'https://link.leo.app/twitter',
        action: t('follow')
      }
    ],
    [t]
  );
  return (
    <div {...props} className={classNames('flex-1', 'flex flex-col', 'bg-white px-10 py-6 gap-y-8', className)}>
      <Message
        icon={IconName.CheckboxCircleFill}
        title={t('yourWalletIsReady')}
        description={t('exploreTheWorldOfPrivateAssets')}
      />

      <div>
        {Links.map((el, idx) => (
          <div key={'link-' + idx} className="flex items-center justify-between py-4 border-t border-grey-100 gap-x-4">
            <span className="text-sm font-medium">{el.title}</span>
            <a href={el.url} target="_blank" rel="noreferrer">
              <Button title={el.action} variant={ButtonVariant.Secondary} className="flex items-center" />
            </a>
          </div>
        ))}
      </div>

      <Button title={t('getStarted')} className="w-[360px] self-center" onClick={onSubmit} isLoading={isLoading} />
    </div>
  );
};
