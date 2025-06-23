import React from 'react';

import classNames from 'clsx';

import { Icon, IconName } from 'app/icons/v2';

export interface ConnectivitiyIssueBannerProps {
  className?: string;
}

export const ConnectivityIssueBanner: React.FC<ConnectivitiyIssueBannerProps> = ({ className }) => {
  return (
    <div className={classNames('h-[56px] flex items-center bg-white  px-4 gap-x-2', className)}>
      <div className="flex items-center">
        <Icon name={IconName.WarningFill} size="md" fill="#FEA644" />
      </div>
      <div className="flex-1 flex flex-col justify-center items-start">
        <p className="text-black text-sm font-medium">Connectivity Issue Detected</p>
        <p className="text-gray-600 text-xs">Wallet may be offline or out of sync</p>
      </div>
      <Icon name={IconName.Close} size="sm" fill="black" className="cursor-pointer hover:opacity-100 opacity-50" />
    </div>
  );
};
