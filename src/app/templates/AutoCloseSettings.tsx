import React, { FC, useCallback, useRef } from 'react';

import { useTranslation } from 'react-i18next';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { isMobile } from 'lib/platform';
import { isAutoCloseEnabled, setAutoCloseSetting } from 'lib/settings/helpers';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

const AutoCloseSettings: FC<{}> = () => {
  // Hide on mobile - it's always enabled there
  if (isMobile()) {
    return null;
  }
  const gpuEnabled = isAutoCloseEnabled();
  const changingRef = useRef(false);
  const { t } = useTranslation();
  const handleAutoCloseChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    if (changingRef.current) return;
    changingRef.current = true;

    setAutoCloseSetting(evt.target.checked);
    changingRef.current = false;
  }, []);

  return (
    <div className="flex w-full justify-between mt-6">
      <div className="flex flex-col w-5/6">
        <label className="leading-tight flex flex-col" htmlFor="gpuEnabled">
          <span
            className="text-black font-medium text-black my-1"
            style={{
              font: '14px',
              lineHeight: '20px'
            }}
          >
            {t('autoCloseSettings')}
          </span>

          <span className="mt-1 text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
            {t('autoCloseSettingsDescription')}
          </span>
        </label>
      </div>
      <ToggleSwitch
        checked={gpuEnabled}
        onChange={handleAutoCloseChange}
        name="autoCloseEnabled"
        containerClassName="my-1"
        testID={GeneralSettingsSelectors.AutoCloseToggle}
      />
    </div>
  );
};

export default AutoCloseSettings;
