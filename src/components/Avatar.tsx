import React from 'react';

import classNames from 'clsx';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  image: string;
}

const classPerSize = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
  xxl: 'w-16 h-16'
};

export const Avatar: React.FC<AvatarProps> = ({ className, size = 'md', image, ...props }) => {
  return (
    <div {...props} className={classNames('rounded-full overflow-hidden', classPerSize[size], className)}>
      <img src={image} alt="avatar" className={classNames('')} />
    </div>
  );
};
