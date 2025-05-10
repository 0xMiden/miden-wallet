import React, { useCallback, useMemo, useState } from 'react';

import { OnSubmit, useForm } from 'react-hook-form';

import Alert from 'app/atoms/Alert';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { Checkbox } from 'components/Checkbox';
import { t, T } from 'lib/i18n/react';
import { useLocalStorage, useMidenContext } from 'lib/miden/front';

const SUBMIT_ERROR_TYPE = 'submit-error';
const LOCK_TIME = 60_000;

type FormData = {
  password: string;
};

const LAST_ATTEMPT = 3;

const checkTime = (i: number) => (i < 10 ? '0' + i : i);

const getTimeLeft = (start: number, end: number) => {
  const isPositiveTime = start + end - Date.now() < 0 ? 0 : start + end - Date.now();
  const diff = isPositiveTime / 1000;
  const seconds = Math.floor(diff % 60);
  const minutes = Math.floor(diff / 60);
  return `${checkTime(minutes)}:${checkTime(seconds)}`;
};

export interface EncryptedWalletFileWalletPasswordProps {
  onGoNext: () => void;
  onGoBack: () => void;
  onPasswordChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const EncryptedWalletFileWalletPassword: React.FC<EncryptedWalletFileWalletPasswordProps> = ({
  onGoNext,
  onPasswordChange
}) => {
  const { unlock } = useMidenContext();

  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>();
  const submitting = formState.isSubmitting;
  const [confirmed, setConfirmed] = useState(false);
  const [attempt, setAttempt] = useLocalStorage<number>('TridentSharedStorageKey.PasswordAttempts', 1);
  const [timelock, setTimeLock] = useLocalStorage<number>('TridentSharedStorageKey.TimeLock', 0);
  const lockLevel = LOCK_TIME * Math.floor(attempt / 3);

  const [timeleft, setTimeleft] = useState(getTimeLeft(timelock, lockLevel));

  const isDisabled = useMemo(() => Date.now() - timelock <= lockLevel, [timelock, lockLevel]);

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ password }) => {
      if (submitting) return;

      clearError('password');
      try {
        if (attempt > LAST_ATTEMPT) await new Promise(res => setTimeout(res, Math.random() * 2000 + 1000));
        await unlock(password);

        setAttempt(1);
        onGoNext();
      } catch (err: any) {
        if (attempt >= LAST_ATTEMPT) setTimeLock(Date.now());
        setAttempt(attempt + 1);
        setTimeleft(getTimeLeft(Date.now(), LOCK_TIME * Math.floor((attempt + 1) / 3)));

        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError('password', SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, setError, unlock, attempt, setAttempt, setTimeLock, onGoNext]
  );

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      <FormField
        ref={register({ required: t('required') })}
        label={t('password')}
        labelDescription={t('encryptedWalletFileDescription')}
        id="encrypted-wallet-file-password"
        type="password"
        name="password"
        errorCaption={errors.password && errors.password.message}
        containerClassName="mb-4"
        onChange={onPasswordChange}
        disabled={isDisabled}
      />
      <div className="flex gap-x-2 w-[360px] text-sm text-left">
        <button className="flex items-center gap-x-2 text-left" onClick={() => setConfirmed(!confirmed)}>
          <Checkbox id="help-us" value={confirmed} />
          <label className="text-black cursor-pointer text-left">{t('encryptedWalletFileConfirmation')}</label>
        </button>
      </div>
      <T id="continue">
        {message => (
          <FormSubmitButton
            className="capitalize w-full justify-center mt-6"
            loading={submitting}
            style={{
              fontSize: '18px',
              lineHeight: '24px',
              paddingLeft: '0.5rem',
              paddingRight: '0.5rem',
              paddingTop: '12px',
              paddingBottom: '12px'
            }}
            disabled={isDisabled || !confirmed}
            onClick={handleSubmit(onSubmit)}
          >
            {message}
          </FormSubmitButton>
        )}
      </T>
      {isDisabled && (
        <Alert
          type="error"
          title={t('error')}
          description={`${t('unlockPasswordErrorDelay')} ${timeleft}`}
          className="mt-8 rounded-lg text-black mx-auto"
          style={{ width: '80%' }}
        />
      )}
    </div>
  );
};

export default EncryptedWalletFileWalletPassword;
