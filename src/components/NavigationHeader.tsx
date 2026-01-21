import React, { HTMLAttributes } from 'react';

import classNames from 'clsx';

import { IconName } from 'app/icons/v2';
import { isMobile } from 'lib/platform';

import { CircleButton } from './CircleButton';

export interface NavigationHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  mode?: 'back' | 'close';
  onBack?: () => void;
  onClose?: () => void;
  showBorder?: boolean;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  className,
  onBack,
  onClose,
  showBorder = false,
  ...props
}) => {
  return (
    <div
      className={classNames(
        'flex flex-row px-4 items-center justify-between',
        showBorder && 'border-b border-grey-100',
        className
      )}
      style={{ paddingTop: isMobile() ? '24px' : '14px', paddingBottom: '14px' }}
    >
      <div className="flex flex-row items-center gap-x-4">
        {onBack ? (
          <CircleButton icon={IconName.ArrowLeft} onClick={onBack} aria-label="Go back" data-testid="nav-back" />
        ) : null}
        <h1 className="text-lg font-semibold">{props.title}</h1>
      </div>
      {onClose ? (
        <CircleButton icon={IconName.Close} onClick={onClose} aria-label="Close" data-testid="nav-close" />
      ) : null}
    </div>
  );
};
