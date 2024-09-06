import React from 'react';

import classNames from 'clsx';

import { Icon, IconName } from 'app/icons/v2';
import colors from 'utils/tailwind-colors';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  icon: IconName;
}

export const CircleButton: React.FC<ButtonProps> = ({ className, title, disabled, icon, ...props }) => {
  const iconColor = disabled ? colors.grey[400] : 'white';

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    props.onClick?.(e);
  };

  return (
    <button
      className={classNames(
        'flex flex-col justify-center items-center gap-y-2',
        'py-2 px-4 group',
        'focus:outline-none shadow-none',
        className
      )}
      disabled={disabled}
      type="button"
      {...props}
      onClick={onClick}
    >
      <div
        className={classNames(
          'flex items-center justify-center p-4 rounded-full',
          'transition duration-300 ease-in-out',
          'bg-primary-500 hover:bg-primary-600 group-disabled:bg-grey-200'
        )}
      >
        <Icon name={icon} fill={iconColor} size={'xs'} />
      </div>
      <p className="text-sm font-medium">{title}</p>
    </button>
  );
};
