import { FC } from 'react';

import classNames from 'clsx';

interface SyncWaveBackgroundProps {
  isSyncing: boolean;
  className?: string;
}

export const SyncWaveBackground: FC<SyncWaveBackgroundProps> = ({ isSyncing, className }) => {
  if (!isSyncing) return null;

  return (
    <div className={classNames('absolute inset-0 overflow-hidden pointer-events-none z-10', className)}>
      {/* Solid background so it's clearly visible */}
      <div className="absolute inset-0 bg-primary-500/20" />
      {/* Animated wave - wider than container so it can sweep across */}
      <div
        className="absolute inset-y-0 w-[200%] animate-gradient-wave bg-gradient-to-r from-transparent via-white/50 to-transparent"
        style={{ left: '-50%' }}
      />
    </div>
  );
};
