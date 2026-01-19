import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import Alert from 'app/atoms/Alert';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { openInFullPage, useAppEnv } from 'app/env';
import SimplePageLayout from 'app/layouts/SimplePageLayout';
import LogoVerticalTitle from 'app/misc/logo-vertical-title.svg';
import { Button, ButtonVariant } from 'components/Button';
import { useFormAnalytics } from 'lib/analytics';
import { isBiometricEnabled } from 'lib/biometric';
import { useLocalStorage, useMidenContext } from 'lib/miden/front';
import { MidenSharedStorageKey } from 'lib/miden/types';
import { isMobile } from 'lib/platform';
import { navigate } from 'lib/woozie';
import { BiometricUnlock } from 'screens/biometric-unlock';

type FormData = {
  password: string;
};

const SUBMIT_ERROR_TYPE = 'submit-error';
const LOCK_TIME = 60_000;
const LAST_ATTEMPT = 3;

const checkTime = (i: number) => (i < 10 ? '0' + i : i);

const getTimeLeft = (start: number, end: number) => {
  const isPositiveTime = start + end - Date.now() < 0 ? 0 : start + end - Date.now();
  const diff = isPositiveTime / 1000;
  const seconds = Math.floor(diff % 60);
  const minutes = Math.floor(diff / 60);
  return `${checkTime(minutes)}:${checkTime(seconds)}`;
};

interface UnlockProps {
  openForgotPasswordInFullPage?: boolean;
}

const Unlock: FC<UnlockProps> = ({ openForgotPasswordInFullPage = false }) => {
  const { t } = useTranslation();
  const { unlock } = useMidenContext();
  const formAnalytics = useFormAnalytics('UnlockWallet');
  const { popup } = useAppEnv();

  const [attempt, setAttempt] = useLocalStorage<number>(MidenSharedStorageKey.PasswordAttempts, 1);
  const [timelock, setTimeLock] = useLocalStorage<number>(MidenSharedStorageKey.TimeLock, 0);
  const lockLevel = LOCK_TIME * Math.floor(attempt / 3);

  // BIOMETRIC UNLOCK STATE - Only used on mobile (PRIMARY ISOLATION GUARD)
  // On extension, showBiometric will always be false
  const [showBiometric, setShowBiometric] = useState(false);
  const [biometricChecked, setBiometricChecked] = useState(false);

  // Check if biometric is enabled on mount (only on mobile)
  useEffect(() => {
    const checkBiometric = async () => {
      // PRIMARY ISOLATION GUARD: Only check biometric on mobile
      console.log('[Unlock] checkBiometric called, isMobile:', isMobile());
      if (!isMobile()) {
        setBiometricChecked(true);
        return;
      }

      const enabled = await isBiometricEnabled();
      console.log('[Unlock] isBiometricEnabled returned:', enabled);
      setShowBiometric(enabled);
      setBiometricChecked(true);
    };
    checkBiometric();
  }, []);

  // Handle successful biometric unlock
  const handleBiometricSuccess = useCallback(
    async (password: string) => {
      try {
        await unlock(password);
        setAttempt(1);
        navigate('/');
      } catch (err: any) {
        console.error('Biometric unlock failed:', err);
        // Fall back to password unlock
        setShowBiometric(false);
      }
    },
    [unlock, setAttempt]
  );

  // Handle fallback to password
  const handleFallbackToPassword = useCallback(() => {
    setShowBiometric(false);
  }, []);

  const [timeleft, setTimeleft] = useState(getTimeLeft(timelock, lockLevel));

  const formRef = useRef<HTMLFormElement>(null);

  const focusPasswordField = useCallback(() => {
    formRef.current?.querySelector<HTMLInputElement>("input[name='password']")?.focus();
  }, []);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm<FormData>();
  const onSubmit = useCallback<SubmitHandler<FormData>>(
    async ({ password }) => {
      if (isSubmitting) return;

      clearErrors('password');
      formAnalytics.trackSubmit();
      try {
        if (attempt > LAST_ATTEMPT) await new Promise(res => setTimeout(res, Math.random() * 2000 + 1000));
        await unlock(password);

        formAnalytics.trackSubmitSuccess();
        setAttempt(1);

        // On mobile, don't reload - the backend state is already updated in-process.
        // Just navigate to home to trigger a re-render with the unlocked state.
        if (isMobile()) {
          navigate('/');
        } else {
          window.location.reload();
        }
      } catch (err: any) {
        formAnalytics.trackSubmitFail();
        if (attempt >= LAST_ATTEMPT) setTimeLock(Date.now());
        setAttempt(attempt + 1);
        setTimeleft(getTimeLeft(Date.now(), LOCK_TIME * Math.floor((attempt + 1) / 3)));

        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError('password', { type: SUBMIT_ERROR_TYPE, message: err.message });
        focusPasswordField();
      }
    },
    [isSubmitting, clearErrors, setError, unlock, focusPasswordField, formAnalytics, attempt, setAttempt, setTimeLock]
  );

  const onForgotPasswordClick = useCallback(() => {
    if (openForgotPasswordInFullPage) {
      navigate('/forgot-password-info');
      openInFullPage();
      if (popup) {
        window.close();
      }
    } else {
      navigate('/forgot-password-info');
    }
  }, [openForgotPasswordInFullPage, popup]);

  const isDisabled = useMemo(() => Date.now() - timelock <= lockLevel, [timelock, lockLevel]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Date.now() - timelock > lockLevel) {
        setTimeLock(0);
      }
      setTimeleft(getTimeLeft(timelock, lockLevel));
    }, 1_000);

    return () => {
      clearInterval(interval);
    };
  }, [timelock, lockLevel, setTimeLock]);

  // Wait for biometric check to complete before rendering
  // This prevents flash of password form on mobile when biometric is enabled
  if (!biometricChecked) {
    return (
      <SimplePageLayout
        icon={
          <>
            <img alt="Miden Wallet Logo" src={`${LogoVerticalTitle}`} />
          </>
        }
      >
        <div className="flex items-center justify-center h-32">{/* Loading state */}</div>
      </SimplePageLayout>
    );
  }

  // Show biometric unlock screen (only on mobile when biometric is enabled)
  if (showBiometric) {
    return <BiometricUnlock onSuccess={handleBiometricSuccess} onFallbackToPassword={handleFallbackToPassword} />;
  }

  // Show password unlock form (default for extension, fallback for mobile)
  return (
    <SimplePageLayout
      icon={
        <>
          <img alt="Miden Wallet Logo" src={`${LogoVerticalTitle}`} />
        </>
      }
    >
      {isDisabled && (
        <Alert
          type="error"
          title={t('error')}
          description={`${t('unlockPasswordErrorDelay')} ${timeleft}`}
          className="-mt-16 rounded-lg text-black mx-auto"
          style={{ width: '80%' }}
        />
      )}
      <form
        ref={formRef}
        className="w-full max-w-sm mx-auto my-8"
        onSubmit={handleSubmit(onSubmit)}
        style={{ padding: '0px 32px' }}
      >
        <FormField
          {...register('password', { required: t('required') })}
          label={
            <div className="font-medium -mb-2" style={{ fontSize: '14px', lineHeight: '20px' }}>
              {t('password')}
            </div>
          }
          id="unlock-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password && errors.password.message}
          autoFocus
          containerClassName="mb-3"
          disabled={isDisabled}
        />

        <FormSubmitButton
          disabled={isDisabled}
          loading={isSubmitting}
          className="w-full justify-center"
          style={{ fontSize: '16px', lineHeight: '24px', padding: '12px 0px' }}
        >
          {t('unlock')}
        </FormSubmitButton>
        <Button
          id={'forgot-password'}
          title={t('forgotPassword')}
          variant={ButtonVariant.Ghost}
          onClick={onForgotPasswordClick}
          className="w-full justify-center mt-2"
          style={{ fontSize: '16px', lineHeight: '24px', padding: '12px 0px' }}
        />
      </form>
    </SimplePageLayout>
  );
};

export default Unlock;
