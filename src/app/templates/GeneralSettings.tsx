import React, { FC } from 'react';

import DelegateSettings from 'app/templates/DelegateSettings';
import { isMobile } from 'lib/platform';

import AutoCloseSettings from './AutoCloseSettings';
import AutoConsumeSettings from './AutoConsumeSettings';
import BiometricSettings from './BiometricSettings';

const GeneralSettings: FC = () => {
  const mobile = isMobile();

  return (
    <div className="w-full max-w-sm mx-auto my-8">
      {/* Biometric settings - only visible on mobile */}
      {mobile && <BiometricSettings />}

      {/* Delegate settings - hidden on mobile (always enabled on mobile) */}
      {!mobile && <DelegateSettings />}

      <AutoCloseSettings />
      <AutoConsumeSettings />
    </div>
  );
};

export default GeneralSettings;
