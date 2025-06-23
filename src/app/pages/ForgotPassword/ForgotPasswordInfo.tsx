import React, { FC, useCallback } from 'react';

import { navigate } from 'lib/woozie';
import ForgotPasswordInfoScreen from 'screens/onboarding/forgot-password-flow/ForgotPasswordInfo';

const ForgotPasswordInfo: FC = () => {
  const onForgotPasswordClose = useCallback(() => navigate('/unlock'), []);

  const onSignOut = useCallback(() => navigate('/forgot-password'), []);

  return <ForgotPasswordInfoScreen onClose={onForgotPasswordClose} onSignOut={onSignOut} />;
};

export default ForgotPasswordInfo;
