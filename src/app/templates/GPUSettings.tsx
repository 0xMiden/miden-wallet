import React, { FC, useCallback, useRef } from 'react';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { isGPUAccelerationEnabled, setGPUAcceleration } from 'lib/gpu/gpu-settings';
import { T } from 'lib/i18n/react';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

const GPUSettings: FC<{}> = () => {
  const gpuEnabled = isGPUAccelerationEnabled();
  const changingRef = useRef(false);

  const handleGPUAccelerationChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    if (changingRef.current) return;
    changingRef.current = true;

    setGPUAcceleration(evt.target.checked);
    changingRef.current = false;
  }, []);

  return (
    <div className="flex justify-between mb-8">
      <div className="flex flex-col w-5/6">
        <label className="leading-tight flex flex-col" htmlFor="gpuEnabled">
          <span
            className="text-black font-medium text-black my-1"
            style={{
              font: '14px',
              lineHeight: '20px'
            }}
          >
            <T id="gpuSettings" />
          </span>

          <span className="mt-1 text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
            <T id="gpuSettingsDescription" />
          </span>
        </label>
      </div>
      <ToggleSwitch
        checked={gpuEnabled}
        onChange={handleGPUAccelerationChange}
        name="gpuEnabled"
        containerClassName="my-1"
        testID={GeneralSettingsSelectors.GPUToggle}
      />
    </div>
  );
};

export default GPUSettings;
