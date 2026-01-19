import React, { FC, useCallback, useRef } from 'react';

import { useTranslation } from 'react-i18next';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { isDelegateProofEnabled, setDelegateProofSetting } from 'lib/settings/helpers';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

const DelegateSettings: FC<{}> = () => {
  const { t } = useTranslation();
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
            {t('delegateProofSettings')}
          </span>

          <span className="mt-1 text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
            {t('delegateProofSettingsDescription')}
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
