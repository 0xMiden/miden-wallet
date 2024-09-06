import React from 'react';

import classNames from 'clsx';

import { Icon, IconName } from 'app/icons/v2';

export interface MessageProps extends React.ButtonHTMLAttributes<HTMLDivElement> {
  icon: IconName;
  title: string;
  description: string;
}

export const Message: React.FC<MessageProps> = ({ className, icon = IconName.Apps, title, description, ...props }) => {
  return (
    <div {...props} className={classNames('flex flex-col justify-center items-center gap-y-8', className)}>
      <div className="w-40 aspect-square rounded-full flex items-center justify-center bg-gradient-to-t from-white to-[#F9F9F9] ">
        <Icon name={icon} fill="black" size="xxl" />
      </div>
      <div className="flex flex-col items-center gap-y-2">
        <h1 className="font-semibold text-2xl">{title}</h1>
        <p className="text-base text-center">{description}</p>
      </div>
    </div>
  );
};
