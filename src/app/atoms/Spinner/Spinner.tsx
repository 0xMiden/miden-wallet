import React, { FC } from 'react';

import CircularProgress from '../CircularProgress';

type SpinnerProps = {
  color?: string;
};

const Spinner: FC<SpinnerProps> = ({ color = '#FF5500' }) => {
  return <CircularProgress borderWeight={2} progress={40} circleColor={color} circleSize={24} spin={true} />;
};

export default Spinner;
