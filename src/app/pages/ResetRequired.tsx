import React, { FC, useCallback } from 'react';

import { navigate } from 'lib/woozie';
import ResetRequiredScreen from 'screens/onboarding/ResetRequired';

const ResetRequired: FC = () => {
  const onConfirm = useCallback(() => {
    navigate('/reset-wallet');
  }, []);

  return <ResetRequiredScreen onConfirm={onConfirm} />;
};

export default ResetRequired;
