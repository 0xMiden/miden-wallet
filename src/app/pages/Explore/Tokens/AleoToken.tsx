import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import { navigate } from 'lib/woozie';

export const AleoToken: FC = () => (
  <Button
    onClick={e => {
      e.preventDefault();
      e.stopPropagation();
      navigate('/explore/aleo/?tab=delegation');
    }}
    className={classNames('ml-1 px-2 py-1')}
  ></Button>
);
