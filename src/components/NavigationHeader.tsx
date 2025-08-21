import React, { HTMLAttributes } from 'react';

import classNames from 'clsx';

import { IconName } from 'app/icons/v2';

import { CircleButton } from './CircleButton';

export interface NavigationHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  mode?: 'back' | 'close';
  onBack?: () => void;
  onClose?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({ className, onBack, onClose, ...props }) => {
  return (
    <div className={classNames('flex flex-row p-4 gap-x-4 items-center', className)}>
      {onBack ? <CircleButton icon={IconName.ArrowLeft} onClick={onBack} /> : null}
      <h1 className="flex-1 text-lg font-semibold">{props.title}</h1>
      {onClose ? <CircleButton icon={IconName.Close} onClick={onClose} /> : null}
    </div>
  );
};
