import React, { FC } from 'react';

import { useTranslation } from 'react-i18next';

import ToggleSwitch from 'app/atoms/ToggleSwitch';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

const LockUpSettings: FC<{}> = () => {
  const { t } = useTranslation();
  return (
    <div className="flex justify-between mb-8">
      <div className="flex flex-col w-5/6">
        <label className="leading-tight flex flex-col" htmlFor="lockUpSettings">
          <span className="text-black font-medium text-black">{t('lockUpSettings')}</span>

          <span className="mt-1 text-xs  text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
            {t('lockUpSettingsDescription')}
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
