import React, { FC, useCallback, useRef } from 'react';

import { useTranslation } from 'react-i18next';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { isPopupModeEnabled, setPopupMode } from 'lib/popup-mode';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

const PopupSettings: FC<{}> = () => {
  const { t } = useTranslation();
  const popupEnabled = isPopupModeEnabled();
  const changingRef = useRef(false);

  const handlePopupModeChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    if (changingRef.current) return;
    changingRef.current = true;

    setPopupMode(evt.target.checked);
    changingRef.current = false;
  }, []);

  return (
    <div className="flex justify-between mb-8">
      <div className="flex flex-col w-5/6">
        <label className="leading-tight flex flex-col" htmlFor="popupEnabled">
          <span
            className="text-black font-medium text-black my-1"
            style={{
              font: '14px',
              lineHeight: '20px'
            }}
          >
            {t('popupSettings')}
          </span>

          <span className="mt-1 text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
            {t('popupSettingsDescription')}
          </span>
        </label>
      </div>
      <ToggleSwitch
        checked={popupEnabled}
        onChange={handlePopupModeChange}
        name="popupEnabled"
        containerClassName="my-1"
        testID={GeneralSettingsSelectors.PopupToggle}
      />
    </div>
  );
};

export default PopupSettings;
