import React, { FC, useCallback, useRef } from 'react';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { T } from 'lib/i18n/react';
import { isDelegateProofEnabled, setDelegateProofSetting } from 'lib/settings/helpers';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

const DelegateSettings: FC<{}> = () => {
  const delegateEnabled = isDelegateProofEnabled();
  const changingRef = useRef(false);

  const handleDelegateSettingChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    if (changingRef.current) return;
    changingRef.current = true;

    setDelegateProofSetting(evt.target.checked);
    changingRef.current = false;
  }, []);

  return (
    <div className="flex justify-between mb-8">
      <div className="flex flex-col w-5/6">
        <label className="leading-tight flex flex-col" htmlFor="delegateEnabled">
          <span
            className="text-black font-medium text-black my-1"
            style={{
              font: '14px',
              lineHeight: '20px'
            }}
          >
            <T id="delegateProofSettings" />
          </span>

          <span className="mt-1 text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
            <T id="delegateProofSettingsDescription" />
          </span>
        </label>
      </div>
      <ToggleSwitch
        checked={delegateEnabled}
        onChange={handleDelegateSettingChange}
        name="delegateEnabled"
        containerClassName="my-1"
        testID={GeneralSettingsSelectors.DelegateToggle}
      />
    </div>
  );
};

export default DelegateSettings;
