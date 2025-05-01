import React, { FC, HTMLAttributes } from 'react';

import randomColor from 'randomcolor';

import { Avatar } from 'components/Avatar';

type ColorIdenticonProps = HTMLAttributes<HTMLDivElement> & {
  publicKey: string;
  size?: number;
};

const ColorIdenticon: FC<ColorIdenticonProps> = ({
  publicKey,
  size = 100,
  className = 'm-auto',
  style = {},
  ...rest
}) => {
  const color = randomColor({ seed: publicKey });

  return (
    <Avatar className={className} style={{ backgroundColor: color }} size="md" image="/misc/avatars/miden-logo.svg" />
  );
};

export default ColorIdenticon;
