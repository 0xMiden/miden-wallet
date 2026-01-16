import React, { FC, useCallback, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import {
  BiometricAvailability,
  checkBiometricAvailability,
  isBiometricEnabled,
  setBiometricEnabled,
  setupBiometric
} from 'lib/biometric';
import { isMobile } from 'lib/platform';

import { GeneralSettingsSelectors } from './GeneralSettings.selectors';

/**
 * BiometricSettings component - Only renders on mobile
 * Allows users to enable/disable biometric unlock
 */
const BiometricSettings: FC = () => {
  const { t } = useTranslation();
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricAvailability['biometryType']>('none');
  const [isLoading, setIsLoading] = useState(true);
  const [toggleKey, setToggleKey] = useState(0); // Key to force toggle reset
  const changingRef = useRef(false);

  // Check biometric availability and current state on mount
  useEffect(() => {
    const init = async () => {
      // PRIMARY ISOLATION GUARD: Only run on mobile
      if (!isMobile()) {
        setIsLoading(false);
        return;
      }

      const availability = await checkBiometricAvailability();
      console.log('[BiometricSettings] Availability:', availability);
      setBiometricAvailable(availability.isAvailable);
      setBiometricType(availability.biometryType);

      if (availability.isAvailable) {
        const enabled = await isBiometricEnabled();
        console.log('[BiometricSettings] Biometric enabled:', enabled);
        setBiometricEnabledState(enabled);
      }

      setIsLoading(false);
    };
    init();
  }, []);

  // Get biometric label based on type
  const getBiometricLabel = useCallback(() => {
    switch (biometricType) {
      case 'face':
        return t('faceId');
      case 'fingerprint':
        return t('fingerprint');
      case 'iris':
        return t('fingerprint');
      case 'multiple':
        return t('biometricUnlock');
      default:
        return t('biometricUnlock');
    }
  }, [biometricType, t]);

  const handleBiometricToggle = useCallback(
    async (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (changingRef.current) return;
      changingRef.current = true;

      const newEnabled = evt.target.checked;

      if (newEnabled) {
        // User wants to enable biometric - need to prompt for password
        // For now, we'll use the setupBiometric flow which handles this
        // In a real implementation, we'd show a password prompt modal
        const password = window.prompt(t('enterPasswordToEnableBiometric'));
        if (password) {
          const success = await setupBiometric(password);
          if (success) {
            setBiometricEnabledState(true);
          } else {
            // Setup failed - force toggle to reset
            setToggleKey(k => k + 1);
          }
        } else {
          // User canceled - force toggle to reset back to disabled
          setToggleKey(k => k + 1);
        }
      } else {
        // User wants to disable biometric
        await setBiometricEnabled(false);
        setBiometricEnabledState(false);
      }

      changingRef.current = false;
    },
    [t]
  );

  // PRIMARY ISOLATION GUARD: Don't render on non-mobile platforms
  if (!isMobile()) {
    return null;
  }

  // Don't render if biometric is not available
  if (!biometricAvailable && !isLoading) {
    return null;
  }

  // Show loading state while checking
  if (isLoading) {
    return null;
  }

  return (
    <div className="flex justify-between mb-8">
      <div className="flex flex-col w-5/6">
        <label className="leading-tight flex flex-col" htmlFor="biometricEnabled">
          <span
            className="text-black font-medium text-black my-1"
            style={{
              font: '14px',
              lineHeight: '20px'
            }}
          >
            {getBiometricLabel()}
          </span>

          <span className="mt-1 text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
            {t('biometricUnlockDescription')}
          </span>
        </label>
      </div>
      <ToggleSwitch
        key={toggleKey}
        checked={biometricEnabled}
        onChange={handleBiometricToggle}
        name="biometricEnabled"
        containerClassName="my-1"
        testID={GeneralSettingsSelectors.BiometricToggle}
      />
    </div>
  );
};

export default BiometricSettings;
