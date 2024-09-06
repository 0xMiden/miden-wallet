import React, { FC, useCallback } from 'react';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { T } from 'lib/i18n/react';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

const LockUpSettings: FC<{}> = () => {
  return (
    <div className="flex justify-between mb-8">
      <div className="flex flex-col w-5/6">
        <label className="leading-tight flex flex-col" htmlFor="lockUpSettings">
          <span className="text-black font-medium text-black">
            <T id="lockUpSettings" />
          </span>

          <span className="mt-1 text-xs  text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
            <T id="lockUpSettingsDescription" />
          </span>
        </label>
      </div>

      <ToggleSwitch
        checked={false}
        onChange={() => {}}
        name="lockUpEnabled"
        containerClassName="my-1"
        testID={GeneralSettingsSelectors.LockUpToggle}
      />
    </div>
  );
};

export default LockUpSettings;
