import React from 'react';

import classNames from 'clsx';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  className?: string;
}

export const Link: React.FC<LinkProps> = ({ className, ...props }) => {
  return (
    <a
      {...props}
      className={classNames(
        'text-blue-600',
        'hover:underline underline-offset-2',
        'decoration-blue-600 cursor-pointer',
        className
      )}
    >
      {props.children}
    </a>
  );
};
