import { FC } from 'react';

import classNames from 'clsx';

interface SyncWaveBackgroundProps {
  isSyncing: boolean;
  className?: string;
}

export const SyncWaveBackground: FC<SyncWaveBackgroundProps> = ({ isSyncing, className }) => {
  if (!isSyncing) return null;

  return (
    <div className={classNames('absolute inset-0 overflow-hidden pointer-events-none', className)}>
      <div className="absolute inset-0 animate-gradient-wave bg-gradient-to-r from-transparent via-primary-200/30 to-transparent" />
    </div>
  );
};
