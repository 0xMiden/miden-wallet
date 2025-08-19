import React, { FC, useCallback, useRef } from 'react';

import { useTranslation } from 'react-i18next';

import ToggleSwitch from 'app/atoms/ToggleSwitch';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

export const AUTO_CONSUME_STORAGE_KEY = 'auto_consume_setting';
export const DEFAULT_AUTO_CONSUME = true;

function setAutoConsumeSetting(enabled: boolean) {
  try {
    localStorage.setItem(AUTO_CONSUME_STORAGE_KEY, JSON.stringify(enabled));
  } catch {}
}

export function isAutoConsumeEnabled() {
  const stored = localStorage.getItem(AUTO_CONSUME_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as boolean) : DEFAULT_AUTO_CONSUME;
}

const AutoConsumeSettings: FC<{}> = () => {
  const consumeEnabled = isAutoConsumeEnabled();
  const changingRef = useRef(false);
  const { t } = useTranslation();

  const handleAutoConsumeChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    if (changingRef.current) return;
    changingRef.current = true;

    setAutoConsumeSetting(evt.target.checked);
    changingRef.current = false;
  }, []);

  return (
    <div className="flex w-full justify-between mt-6">
      <div className="flex flex-col w-5/6">
        <label className="leading-tight flex flex-col" htmlFor="consumeEnabled">
          <span
            className="text-black font-medium text-black my-1"
            style={{
              font: '14px',
              lineHeight: '20px'
            }}
          >
            {t('autoConsumeSettings')}
          </span>

          <span className="mt-1 text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
            {t('autoConsumeSettingsDescription')}
          </span>
        </label>
      </div>
      <ToggleSwitch
        checked={consumeEnabled}
        onChange={handleAutoConsumeChange}
        name="autoConsumeEnabled"
        containerClassName="my-1"
        testID={GeneralSettingsSelectors.AutoConsumeToggle}
      />
    </div>
  );
};

export default AutoConsumeSettings;
