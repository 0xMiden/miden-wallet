import React, { useCallback, useMemo, useState } from 'react';

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import Alert from 'app/atoms/Alert';
import { Icon, IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Checkbox } from 'components/Checkbox';
import { Input } from 'components/Input';
import { NavigationHeader } from 'components/NavigationHeader';
import { useLocalStorage, useMidenContext } from 'lib/miden/front';
import { goBack } from 'lib/woozie';

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
  walletPassword?: string;
}

const EncryptedWalletFileWalletPassword: React.FC<EncryptedWalletFileWalletPasswordProps> = ({
  onGoNext,
  onPasswordChange,
  walletPassword
}) => {
  const { unlock } = useMidenContext();
  const { t } = useTranslation();
  const { errors, setError, clearError, formState } = useForm<FormData>();
  const submitting = formState.isSubmitting;
  const [confirmed, setConfirmed] = useState(false);
  const [attempt, setAttempt] = useLocalStorage<number>('TridentSharedStorageKey.PasswordAttempts', 1);
  const [timelock, setTimeLock] = useLocalStorage<number>('TridentSharedStorageKey.TimeLock', 0);
  const lockLevel = LOCK_TIME * Math.floor(attempt / 3);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const onPasswordVisibilityToggle = useCallback(() => {
    setIsPasswordVisible(prev => !prev);
  }, []);

  const [timeleft, setTimeleft] = useState(getTimeLeft(timelock, lockLevel));

  const isDisabled = useMemo(() => Date.now() - timelock <= lockLevel, [timelock, lockLevel]);

  const onSubmit = useCallback(async () => {
    if (submitting) return;

    clearError('password');
    try {
      if (attempt > LAST_ATTEMPT) await new Promise(res => setTimeout(res, Math.random() * 2000 + 1000));
      await unlock(walletPassword!);

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
  }, [submitting, clearError, setError, unlock, attempt, setAttempt, setTimeLock, onGoNext, walletPassword]);

  const handleEnterKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && confirmed) {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit, confirmed]
  );

  return (
    <div className="flex-1 flex flex-col">
      <NavigationHeader title={t('encryptedWalletFile')} onBack={goBack} mode="back" />
      <div className="flex flex-col flex-1 p-4 md:w-[460px] md:mx-auto">
        <div className="flex-1 flex flex-col justify-stretch gap-y-4">
          <p className="text-sm">{t('encryptedWalletFileDescription')}</p>
          <div className="flex flex-col gap-y-2">
            <Input
              type={isPasswordVisible ? 'text' : 'password'}
              label={t('password')}
              value={walletPassword}
              disabled={isDisabled}
              placeholder={t('enterPassword')}
              icon={
                <button className="flex-1" onClick={onPasswordVisibilityToggle}>
                  <Icon name={isPasswordVisible ? IconName.EyeOff : IconName.Eye} fill="black" />
                </button>
              }
              onChange={onPasswordChange}
              onKeyDown={handleEnterKey}
            />
            {errors.password && <p className="h-4 text-red-500 text-xs">{errors.password.message}</p>}
          </div>
          <div className="flex gap-x-2 text-sm text-left">
            <button className="flex mt-3 gap-x-2 text-left" onClick={() => setConfirmed(!confirmed)}>
              <Checkbox id="help-us" value={confirmed} />
              <span className="text-black cursor-pointer text-left mt-[-4px]">
                {t('encryptedWalletFileConfirmation')}
              </span>
            </button>
          </div>
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
        <Button
          className="w-full justify-center mt-6"
          variant={ButtonVariant.Primary}
          title={t('continue')}
          disabled={isDisabled || !confirmed}
          onClick={onSubmit}
          isLoading={submitting}
        />
      </div>
    </div>
  );
};

export default EncryptedWalletFileWalletPassword;
