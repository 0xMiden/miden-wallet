import React, { FC, useCallback, useState } from 'react';

import { useTranslation } from 'react-i18next';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { isHapticFeedbackEnabled, setHapticFeedbackSetting } from 'lib/settings/helpers';
import { isMobile } from 'lib/platform';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

/**
 * HapticFeedbackSettings component - Only renders on mobile
 * Allows users to enable/disable haptic feedback
 */
const HapticFeedbackSettings: FC = () => {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(() => isHapticFeedbackEnabled());

  const handleToggle = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = evt.target.checked;
    setHapticFeedbackSetting(newEnabled);
    setEnabled(newEnabled);
  }, []);

  // Only render on mobile
  if (!isMobile()) {
    return null;
  }

  return (
    <div className="flex justify-between mb-8">
      <div className="flex flex-col w-5/6">
        <label className="leading-tight flex flex-col" htmlFor="hapticFeedbackEnabled">
          <span
            className="text-black font-medium text-black my-1"
            style={{
              font: '14px',
              lineHeight: '20px'
            }}
          >
            {t('hapticFeedback')}
          </span>

          <span className="mt-1 text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
            {t('hapticFeedbackDescription')}
          </span>
        </label>
      </div>
      <ToggleSwitch
        checked={enabled}
        onChange={handleToggle}
        name="hapticFeedbackEnabled"
        containerClassName="my-1"
        testID={GeneralSettingsSelectors.HapticFeedbackToggle}
      />
    </div>
  );
};

export default HapticFeedbackSettings;
