import React, { FC } from 'react';

import { DecryptPermission } from '@demox-labs/miden-wallet-adapter';
import classNames from 'clsx';

import { Icon, IconName } from 'app/icons/v2';
import colors from 'utils/tailwind-colors';

type DecryptPermissionBannerProps = {
  decryptPermission: DecryptPermission;
  programs?: string[];
};

const DecryptPermissionBanner: FC<DecryptPermissionBannerProps> = ({ programs }) => {
  const checkboxIcon = (
    <Icon name={IconName.CheckboxCircle} size="sm" fill={colors.primary[500]} className="shrink-0 mr-3" />
  );
  return (
    <div className={classNames('w-full', 'mb-4', 'flex flex-col')}>
      <div className={classNames('flex', 'mb-4')}>
        {checkboxIcon}
        <p className="text-sm">Let it see your wallet balance and activity</p>
      </div>
      <div className={classNames('flex', 'mb-4')}>
        {checkboxIcon}
        <p className="text-sm">Let it send you requests for transactions</p>
      </div>
      <div className={classNames('flex')}>
        {checkboxIcon}
        <p className="text-sm">Funds will not leave your wallet until you execute a transaction</p>
      </div>
    </div>
  );
};

export default DecryptPermissionBanner;
