import React from 'react';

import classNames from 'clsx';

import { Icon, IconName, IconSize } from 'app/icons/v2';
import { IconOrComponent } from 'utils/icon-or-component';

/**
 * CardItemProps interface for CardItem component
 */
export interface CardItemProps extends React.ComponentProps<'div'> {
  className?: string;
  iconLeft?: React.ReactNode | IconName;
  iconRight?: React.ReactNode | IconName;
  title?: string;
  subtitle?: string;
  titleRight?: string;
  subtitleRight?: string;
  animateHover?: boolean;
}

export const LeftIconOrComponent = ({
  icon,
  color,
  size = 'md'
}: {
  icon: React.ReactNode | IconName;
  color: string;
  size?: IconSize;
}) => {
  if (Object.values(IconName).includes(icon as IconName)) {
    return (
      <div className="bg-grey-50 p-2 rounded-full">
        <Icon name={icon as IconName} fill={color} className="w-4 h-4" size={size} />
      </div>
    );
  }

  return <>{icon}</>;
};

/**
 * CardItem functional component
 * @param {CardItemProps} props - properties that define the CardItem component
 * @returns {JSX.Element} - rendered CardItem component
 */
export const CardItem: React.FC<CardItemProps> = ({
  className,
  title,
  subtitle,
  iconLeft,
  iconRight,
  titleRight,
  subtitleRight,
  animateHover = true,
  ...props
}) => {
  const cardItemClasses = classNames(
    'flex items-center justify-evenly', // Layout classes
    'h-[56px] p-2', // Size and padding classes
    'gap-x-2 bg-white', // Gap and background classes
    'rounded-lg transition', // Shape and transition classes
    'duration-300 ease-in-out', // Transition duration and timing function classes
    animateHover && 'hover:bg-grey-50 cursor-pointer', // Hover and cursor classes
    'overflow-hidden',
    className // User-defined classes
  );

  return (
    <div {...props} className={cardItemClasses}>
      <div className="shrink-0">{iconLeft && <LeftIconOrComponent icon={iconLeft} color="black" />}</div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex-col flex justify-center overflow-hidden">
          {title && <p className="text-sm font-medium text-black truncate text-ellipsis text-left">{title}</p>}
          {subtitle && <p className="text-xs text-grey-600 truncate text-ellipsis">{subtitle}</p>}
        </div>
        {(titleRight || subtitleRight) && (
          <div className="text-sm text-grey-600 flex flex-col justify-center items-end">
            {titleRight && <div className="text-sm font-medium text-black">{titleRight}</div>}
            {subtitleRight && <div className="text-xs text-grey-600">{subtitleRight}</div>}
          </div>
        )}
      </div>
      <div className="shrink-0">{iconRight && <IconOrComponent icon={iconRight} color="black" />}</div>
    </div>
  );
};
