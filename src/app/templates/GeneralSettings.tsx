import React, { FC } from 'react';

import AnalyticsSettings from 'app/templates/AnalyticsSettings';
import DelegateSettings from 'app/templates/DelegateSettings';
import GPUSettings from 'app/templates/GPUSettings';
import LocaleSelect from 'app/templates/LocaleSelect';
import LockUpSettings from 'app/templates/LockUpSettings';
import PopupSettings from 'app/templates/PopupSettings';

const GeneralSettings: FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <LocaleSelect className="mb-8" />

      <PopupSettings />

      <LockUpSettings />

      <DelegateSettings />

      <GPUSettings />

      <AnalyticsSettings />
    </div>
  );
};

export default GeneralSettings;
