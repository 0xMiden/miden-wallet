import React, { FC, HTMLAttributes } from 'react';

import classNames from 'clsx';

type SubTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  uppercase?: boolean;
  small?: boolean;
};

const SubTitle: FC<SubTitleProps> = ({ className, children, uppercase = true, small = false, ...rest }) => {
  return (
    <h2
      className={classNames(
        'flex items-center justify-center',
        'text-black',
        small ? 'text-xl' : 'text-2xl',
        '',
        uppercase && 'uppercase',
        className
      )}
      {...rest}
    >
      {children}
    </h2>
  );
};

export default SubTitle;
