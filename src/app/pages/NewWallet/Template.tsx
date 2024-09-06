import React, { FC, ReactNode } from 'react';

import classNames from 'clsx';

import { PropsWithChildren } from 'lib/props-with-children';

interface TemplateProps extends PropsWithChildren {
  title: ReactNode;
}

export const Template: FC<TemplateProps> = ({ title, children }) => (
  <div className="py-4 px-6">
    <h1 className={classNames('mt-2 text-sm text-black font-medium')}>{title}</h1>
    {children}
  </div>
);
