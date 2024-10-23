import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'clsx';
import { OnSubmit, useForm } from 'react-hook-form';

import Alert from 'app/atoms/Alert';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import SimplePageLayout from 'app/layouts/SimplePageLayout';
import LogoVerticalTitle from 'app/misc/logo-vertical-title.svg';
import { useLocalStorage, useMidenContext } from 'lib/miden/front';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import { Link } from 'lib/woozie';

interface UnlockProps {
  canImportNew?: boolean;
}

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

const Unlock: FC<UnlockProps> = ({ canImportNew = true }) => {
  const { unlock } = useMidenContext();
  const formAnalytics = useFormAnalytics('UnlockWallet');

  const [attempt, setAttempt] = useLocalStorage<number>('AleoSharedStorageKey.PasswordAttempts', 1);
  const [timelock, setTimeLock] = useLocalStorage<number>('AleoSharedStorageKey.TimeLock', 0);
  const lockLevel = LOCK_TIME * Math.floor(attempt / 3);

  const [timeleft, setTimeleft] = useState(getTimeLeft(timelock, lockLevel));

  const formRef = useRef<HTMLFormElement>(null);

  const focusPasswordField = useCallback(() => {
    formRef.current?.querySelector<HTMLInputElement>("input[name='password']")?.focus();
  }, []);

  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ password }) => {
      if (submitting) return;

      clearError('password');
      formAnalytics.trackSubmit();
      try {
        if (attempt > LAST_ATTEMPT) await new Promise(res => setTimeout(res, Math.random() * 2000 + 1000));
        await unlock(password);

        formAnalytics.trackSubmitSuccess();
        setAttempt(1);
        window.location.reload();
      } catch (err: any) {
        formAnalytics.trackSubmitFail();
        if (attempt >= LAST_ATTEMPT) setTimeLock(Date.now());
        setAttempt(attempt + 1);
        setTimeleft(getTimeLeft(Date.now(), LOCK_TIME * Math.floor((attempt + 1) / 3)));

        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError('password', SUBMIT_ERROR_TYPE, err.message);
        focusPasswordField();
      }
    },
    [submitting, clearError, setError, unlock, focusPasswordField, formAnalytics, attempt, setAttempt, setTimeLock]
  );

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

  return (
    <SimplePageLayout
      icon={
        <>
          <img alt="Leo Wallet Logo" src={`${LogoVerticalTitle}`} />
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
          ref={register({ required: t('required') })}
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
          loading={submitting}
          className="w-full justify-center"
          style={{ fontSize: '16px', lineHeight: '24px', padding: '12px 0px' }}
        >
          {t('unlock')}
        </FormSubmitButton>

        {canImportNew && (
          <div
            style={{
              position: 'absolute',
              top: '524px',
              left: 'calc(50% - 132px)',
              width: '264px',
              textAlign: 'center',
              fontSize: '12px',
              lineHeight: '16px'
            }}
          >
            <T id="importNewAccountTitle">{message => <h3 className="text-black">{message}</h3>}</T>

            <T id="importWalletUsingSeedPhrase">
              {message => (
                <Link
                  to="/import-wallet"
                  className={classNames(
                    'text-primary-purple',
                    'transition duration-200 ease-in-out',
                    'opacity-75 hover:opacity-100 focus:opacity-100',
                    'hover:underline'
                  )}
                >
                  {message}
                </Link>
              )}
            </T>
          </div>
        )}
      </form>
    </SimplePageLayout>
  );
};

export default Unlock;
