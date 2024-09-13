import React, { useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Button } from 'components/Button';
import { Checkbox } from 'components/Checkbox';
import { Input } from 'components/Input';
import { Link } from 'components/Link';

interface PasswordValidation {
  minChar: boolean;
  cases: boolean;
  number: boolean;
  specialChar: boolean;
  strongPasswordLength?: boolean;
}

const MIN_PASSWORD_LENGTH = 8;
const STRONG_PASSWORD_LENGTH = 12;
const uppercaseLowercaseMixtureRegx = /(?=.*[a-z])(?=.*[A-Z])/;
const lettersNumbersMixtureRegx = /(?=.*\d)(?=.*[A-Za-z])/;
const specialCharacterRegx = /[!@#$%^&*()_+\-=\]{};':"\\|,.<>?]/;

export interface CreatePasswordScreenProps extends Omit<React.ButtonHTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  onSubmit?: (password: string) => void;
}

const PasswordStrengthIndicator = ({ password, validation }: { password: string; validation: PasswordValidation }) => {
  const { t } = useTranslation();
  const validationChecks = useMemo(() => Object.values(validation).filter(Boolean).length, [validation]);
  const validationMessage = useMemo(() => {
    if (validationChecks === 5) {
      return t('veryStrong');
    }
    if (validationChecks >= 3) {
      return t('medium');
    }

    if (validationChecks === 2) {
      return t('low');
    }

    return t('8chars1number');
  }, [validationChecks, t]);
  const validationColor = useMemo(() => {
    if (validationChecks === 5) {
      return 'bg-green-500';
    }
    if (validationChecks >= 3) {
      return 'bg-yellow-500';
    }

    if (validationChecks === 2) {
      return 'bg-red-500';
    }

    return 'bg-grey-100';
  }, [validationChecks]);

  // TODO: show strength indicator if password is more than 0 characters
  return (
    <div className="h-4 text-xs">
      {password.length > 0 ? (
        <div className="flex flex-row justify-between items-center">
          <div className="flex flex-row gap-x-2">
            {[2, 3, 5].map(check => (
              <div
                key={`check-${check}`}
                className={`h-1 w-10 rounded-md ${validationChecks >= check ? validationColor : 'bg-grey-100'}`}
              />
            ))}
          </div>
          <p className="text-xs text-grey-600">{validationMessage}</p>
        </div>
      ) : (
        <p className="text-xs text-grey-600">{t('minimumCharsWithAtLeast')}</p>
      )}
    </div>
  );
};

export const CreatePasswordScreen: React.FC<CreatePasswordScreenProps> = ({ className, onSubmit, ...props }) => {
  const { t } = useTranslation();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [password, setPassword] = useState('');
  const [verifyPassword, setVerifyPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isVerifyPasswordVisible, setIsVerifyPasswordVisible] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minChar: false,
    cases: false,
    number: false,
    specialChar: false,
    strongPasswordLength: false
  });

  const onTermsAcceptedToggle = (value: boolean) => {
    setTermsAccepted(value);
  };

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  useEffect(() => {
    setPasswordValidation({
      minChar: password.length >= MIN_PASSWORD_LENGTH,
      cases: uppercaseLowercaseMixtureRegx.test(password),
      number: lettersNumbersMixtureRegx.test(password),
      specialChar: specialCharacterRegx.test(password),
      strongPasswordLength: password.length >= STRONG_PASSWORD_LENGTH
    });
  }, [password]);

  const isValidPassword = useMemo(
    () => Object.values(passwordValidation).filter(Boolean).length > 1 && password === verifyPassword,
    [passwordValidation, password, verifyPassword]
  );

  const onPasswordSubmit = useCallback(() => {
    if (isValidPassword && onSubmit) {
      onSubmit(password);
    }
  }, [isValidPassword, onSubmit, password]);

  const onPasswordVisibilityToggle = useCallback(() => {
    setIsPasswordVisible(prev => !prev);
  }, []);

  const onVerifyPasswordVisibilityToggle = useCallback(() => {
    setIsVerifyPasswordVisible(prev => !prev);
  }, []);

  return (
    <div className={classNames('flex-1', 'flex flex-col', 'bg-white gap-y-8 p-6', className)} {...props}>
      <div className="flex flex-col items-center">
        <header className="text-2xl font-semibold">{t('createPassword')}</header>
        <p className="text-sm font-normal mt-2 text-center w-[500px]">{t('createPasswordDescription')}</p>
      </div>

      <article className="w-[360px] flex flex-col gap-y-4 self-center">
        <div className="flex flex-col gap-y-2">
          <Input
            type={isPasswordVisible ? 'text' : 'password'}
            label={t('password')}
            value={password}
            placeholder={t('enterPassword')}
            icon={
              <button className="flex-1" onClick={onPasswordVisibilityToggle}>
                <Icon name={isPasswordVisible ? IconName.EyeOff : IconName.Eye} fill="black" />
              </button>
            }
            onChange={onPasswordChange}
          />
          <PasswordStrengthIndicator password={password} validation={passwordValidation} />
        </div>

        <div className="flex flex-col gap-y-2">
          <Input
            type={isVerifyPasswordVisible ? 'text' : 'password'}
            label={t('verifyPassword')}
            value={verifyPassword}
            placeholder={t('enterPasswordAgain')}
            icon={
              <button className="flex-1" onClick={onVerifyPasswordVisibilityToggle}>
                <Icon name={isVerifyPasswordVisible ? IconName.EyeOff : IconName.Eye} fill="black" />
              </button>
            }
            onChange={e => setVerifyPassword(e.target.value)}
          />
          <p
            className={classNames(
              'h-4 text-green-500 text-xs',
              isValidPassword && password === verifyPassword ? 'opacity-100' : 'opacity-0'
            )}
          >
            {t('itsAMatch')}
          </p>
        </div>
      </article>

      <div className="flex gap-x-2 w-[360px] text-sm self-center">
        <button className="flex gap-x-2 items-center " onClick={() => onTermsAcceptedToggle(!termsAccepted)}>
          <Checkbox id="help-us" value={termsAccepted} />
          <label className="text-black cursor-pointer">{t('helpUsToImproveLeoWallet')}</label>
        </button>
        <Link target="_blank" href="https://www.leo.app/privacy">
          ({t('readMoreOnboarding')})
        </Link>
      </div>

      {/* TODO: add link component */}
      <div className="w-[360px] flex flex-col gap-2 self-center">
        <Button title={t('continue')} disabled={!isValidPassword} onClick={onPasswordSubmit} />
        <p className="text-grey-600 text-xs text-center px-4">
          By proceeding, you agree to the{' '}
          <Link target="_blank" href="https://www.leo.app/terms">
            Terms of Usage
          </Link>{' '}
          and{' '}
          <Link target="_blank" href="https://www.leo.app/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
};
