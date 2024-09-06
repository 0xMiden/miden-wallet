import React, { FC } from 'react';

import classNames from 'clsx';

import { T, t } from 'lib/i18n/react';

type DecryptPermissionBannerProps = {
  programs?: string[];
};

const DecryptPermissionBanner: FC<DecryptPermissionBannerProps> = ({ programs }) => {
  let programsMessage = programs && programs.length > 0 ? programs.join(', ') : t('allPrograms');
  programsMessage = `${t('connectFor')} ${programsMessage}`;
  return (
    <div className={classNames('w-full', 'mb-4', 'flex flex-col')}>
      <h2 className={classNames('leading-tight', 'flex flex-col')}>
        <T id="decryptPermission">
          {message => (
            <span
              className={classNames('mb-2', 'text-black font-medium')}
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              {message}
            </span>
          )}
        </T>
      </h2>
      <div className={classNames('mb-1', 'flex items-center')}>
        <T id={'TODO'}>{message => <span className="text-black text-sm">{message}</span>}</T>
      </div>
      <div className={classNames('mb-1', 'flex items-center')}>
        <span className="text-black text-sm underline">{programsMessage}</span>
      </div>
    </div>
  );
};

export default DecryptPermissionBanner;
