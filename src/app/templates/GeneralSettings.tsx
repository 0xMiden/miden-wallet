import React, { FC } from 'react';

import DelegateSettings from 'app/templates/DelegateSettings';

import AutoCloseSettings from './AutoCloseSettings';
import AutoConsumeSettings from './AutoConsumeSettings';

const GeneralSettings: FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <DelegateSettings />
      <AutoCloseSettings />
      <AutoConsumeSettings />
    </div>
  );
};

export default GeneralSettings;
