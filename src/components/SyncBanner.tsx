import React from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';

import { Loader } from './Loader';

export interface SyncBannerProps extends React.HTMLAttributes<HTMLButtonElement> {
  className?: string;
  progress: number;
  isFullScreen?: boolean;
}

export const SyncBanner: React.FC<SyncBannerProps> = ({ className, progress, isFullScreen, ...props }) => {
  const { t } = useTranslation();
  return (
    <button
      {...props}
      className={classNames('h-[56px] flex items-center bg-black  px-4 gap-x-2', className)}
      type="button"
      disabled={isFullScreen}
    >
      <div className="flex items-center">
        <Loader size="md" color="white" />
      </div>
      <div className="flex-1 flex flex-col justify-center items-start">
        <p className="text-white text-sm font-medium">
          {t('balancePending')} - <b>{progress}</b> %
        </p>
        <p className="text-white text-xs">{t(isFullScreen ? 'keepTabOpenForSync' : 'openNewTabToSync')}</p>
      </div>
      {!isFullScreen && <Icon name={IconName.ArrowRightUp} size="sm" fill="white" />}
    </button>
  );
};
