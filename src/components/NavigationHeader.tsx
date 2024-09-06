import React, { HTMLAttributes } from 'react';

import classNames from 'clsx';

import { IconName } from 'app/icons/v2';

import { SquareButton } from './SquareButton';

export interface NavigationHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  mode?: 'back' | 'close';
  onBack?: () => void;
  onClose?: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({ className, onBack, onClose, ...props }) => {
  return (
    <div className={classNames('flex flex-row p-4 gap-x-4 items-center', className)}>
      {onBack ? <SquareButton icon={IconName.ArrowLeft} onClick={onBack} /> : null}
      <h1 className="flex-1 text-lg font-semibold">{props.title}</h1>
      {onClose ? <SquareButton icon={IconName.Close} onClick={onClose} /> : null}
    </div>
  );
};
