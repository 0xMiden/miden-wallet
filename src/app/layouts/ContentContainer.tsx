import React, { FC, HTMLAttributes } from 'react';

import classNames from 'clsx';

type ContentContainerProps = HTMLAttributes<HTMLDivElement> & {
  padding?: boolean;
};

const ContentContainer: FC<ContentContainerProps> = ({ padding = true, className, ...rest }) => (
  <div className={classNames('w-full flex flex-col flex-1 min-h-0 overflow-hidden', className)} {...rest} />
);

export default ContentContainer;
