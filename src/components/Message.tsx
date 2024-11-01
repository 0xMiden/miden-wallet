import React from 'react';

import classNames from 'clsx';

import { Icon, IconName } from 'app/icons/v2';

export interface MessageProps extends React.ButtonHTMLAttributes<HTMLDivElement> {
  icon: IconName;
  title: string;
  description: string;
  iconBackgroundClassName?: string;
}

export const Message: React.FC<MessageProps> = ({
  className,
  iconBackgroundClassName,
  icon = IconName.Apps,
  title,
  description,
  ...props
}) => {
  return (
    <div {...props} className="flex flex-col justify-center items-center">
      <div className={classNames('w-40 aspect-square flex items-center justify-center', iconBackgroundClassName)}>
        <Icon name={icon} size="xxl" />
      </div>
      <div className="flex flex-col items-center">
        <h1 className="font-semibold text-2xl lh-title">{title}</h1>
        <p className="text-base text-center lh-title">{description}</p>
      </div>
    </div>
  );
};
