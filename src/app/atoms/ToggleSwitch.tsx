import React, { forwardRef, InputHTMLAttributes, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';

import { AnalyticsEventCategory, TestIDProps, useAnalytics } from 'lib/analytics';
import { checkedHandler } from 'lib/ui/inputHandlers';

type ToggleSwitchProps = InputHTMLAttributes<HTMLInputElement> &
  TestIDProps & {
    containerClassName?: string;
    errored?: boolean;
  };

const ToggleSwitch = forwardRef<HTMLInputElement, ToggleSwitchProps>(
  (
    {
      containerClassName,
      errored = false,
      testID,
      testIDProperties,
      className,
      checked,
      onChange,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const [localChecked, setLocalChecked] = useState(() => checked ?? false);
    const { trackEvent } = useAnalytics();

    useEffect(() => {
      setLocalChecked(prevChecked => checked ?? prevChecked);
    }, [setLocalChecked, checked]);

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        testID !== undefined && trackEvent(testID, AnalyticsEventCategory.Toggle, testIDProperties);
        checkedHandler(e, onChange!, setLocalChecked);
      },
      [onChange, setLocalChecked, trackEvent, testID, testIDProperties]
    );

    return (
      <div
        className={classNames(
          'relative inline-block w-12 align-middle select-none transition duration-200 ease-in',
          containerClassName
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className={classNames(
            'toggle-checkbox absolute block w-full h-6 rounded-full bg-white border-4 appearance-none cursor-pointer',
            'opacity-0',
            className
          )}
          checked={localChecked}
          onChange={handleChange}
          {...rest}
        />
        <label
          htmlFor={rest.id}
          className={classNames(
            'toggle-label block overflow-hidden h-6 rounded-full cursor-pointer',
            localChecked ? 'bg-primary-purple' : 'bg-white',
            'transition ease-in-out duration-200'
          )}
          style={{ border: localChecked ? '' : '2px solid #E5E7EB' }}
        >
          <div
            className={`dot absolute rounded-full transform-gpu transition-transform duration-200 ease-in ${
              localChecked ? 'bg-white translate-x-full' : 'bg-primary-purple'
            }`}
            style={{
              height: '14px',
              width: '14px',
              top: '5px',
              left: localChecked ? '16px' : '4px',
              pointerEvents: 'none'
            }}
          ></div>
        </label>
      </div>
    );
  }
);

export default ToggleSwitch;
