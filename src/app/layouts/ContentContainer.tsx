import React, { FC, HTMLAttributes } from 'react';

import classNames from 'clsx';

type ContentContainerProps = HTMLAttributes<HTMLDivElement> & {
  padding?: boolean;
};

const ContentContainer: FC<ContentContainerProps> = ({ padding = true, className, ...rest }) => (
  <div className={classNames('w-full', className)} {...rest} />
);

export default ContentContainer;
