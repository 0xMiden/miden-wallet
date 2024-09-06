import React from 'react';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { useAnalyticsSettings } from 'lib/analytics';
import { T } from 'lib/i18n/react';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

const AnalyticsSettings: React.FC = () => {
  const { analyticsEnabled, setAnalyticsEnabled } = useAnalyticsSettings();

  const handlePopupModeChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setAnalyticsEnabled(evt.target.checked);
  };

  return (
    <div className="flex justify-between mb-8">
      <div className="flex flex-col w-5/6">
        <label className="mb-4 leading-tight flex flex-col" htmlFor="analyticsSettings">
          <span className="text-black font-medium text-black">
            <T id="analyticsSettings" />
          </span>

          <span className="mt-1 text-xs  text-black" style={{ maxWidth: '90%' }}>
            <T id="analyticsSettingsDescription" />
          </span>
        </label>
      </div>

      <ToggleSwitch
        checked={analyticsEnabled}
        onChange={handlePopupModeChange}
        name="analyticsEnabled"
        containerClassName="my-1"
        testID={GeneralSettingsSelectors.AnalyticsToggle}
      />
    </div>
  );
};

export default AnalyticsSettings;
