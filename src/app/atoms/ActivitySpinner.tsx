import * as React from 'react';

import Spinner from './Spinner/Spinner';

interface ActivitySpinnerProps {
  height?: string;
}

export const ActivitySpinner: React.FC<ActivitySpinnerProps> = ({ height = '21px' }) => (
  <div className="w-full pt-8 flex items-center justify-center" style={{ height }}>
    <Spinner />
  </div>
);
