import React, { useEffect, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FormField, { PASSWORD_ERROR_CAPTION } from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { lettersNumbersMixtureRegx, specialCharacterRegx, uppercaseLowercaseMixtureRegx } from 'app/defaults';
import { MIN_PASSWORD_LENGTH } from 'app/pages/NewWallet/SetWalletPassword';
import { T } from 'lib/i18n/react';
import {
  PasswordStrengthIndicator,
  PasswordValidation,
  STRONG_PASSWORD_LENGTH
} from 'screens/onboarding/common/CreatePassword';

interface FormData {
  shouldUseKeystorePassword?: boolean;
  password?: string;
  repeatPassword?: string;
  termsAccepted: boolean;
  analytics?: boolean;
  skipOnboarding?: boolean;
}

export interface ExportFilePasswordProps {
  onGoNext: () => void;
  onGoBack: () => void;
  passwordValue: string;
  handlePasswordChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const ExportFilePassword: React.FC<ExportFilePasswordProps> = ({
  onGoBack,
  onGoNext,
  handlePasswordChange,
  passwordValue
}) => {
  const { t } = useTranslation();

  const [verifyPassword, setVerifyPassword] = useState('');

  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minChar: false,
    cases: false,
    number: false,
    specialChar: false,
    strongPasswordLength: passwordValue.length >= STRONG_PASSWORD_LENGTH
  });

  const { register, formState, errors } = useForm<FormData>({
    mode: 'onChange' // Validate on change
  });

  const onSubmit = () => {
    onGoNext();
  };

  useEffect(() => {
    setPasswordValidation({
      minChar: passwordValue.length >= MIN_PASSWORD_LENGTH,
      cases: uppercaseLowercaseMixtureRegx.test(passwordValue),
      number: lettersNumbersMixtureRegx.test(passwordValue),
      specialChar: specialCharacterRegx.test(passwordValue),
      strongPasswordLength: passwordValue.length >= STRONG_PASSWORD_LENGTH
    });
  }, [passwordValue]);

  const isValidPassword = useMemo(
    () => Object.values(passwordValidation).filter(Boolean).length > 1 && passwordValue === verifyPassword,
    [passwordValidation, passwordValue, verifyPassword]
  );

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      <div className="flex flex-col items-center">
        <p className="text-sm text-center font-normal mt-2 w-[500px]">
          Enter a password to encrypt your wallet file. You'll need this password to restore your wallet later.
        </p>
      </div>

      <div className="w-full justify-center items-center flex flex-col gap-y-4 px-6">
        <div className="flex flex-col w-[360px] gap-y-2">
          <FormField
            ref={register({
              required: PASSWORD_ERROR_CAPTION
            })}
            label={t('password')}
            id="exportfile-password"
            type="password"
            name="password"
            placeholder="********"
            errorCaption={errors.password?.message}
            onChange={handlePasswordChange}
            containerClassName="mx-2"
          />
          <PasswordStrengthIndicator password={passwordValue} validation={passwordValidation} />
        </div>
        <div className="flex flex-col w-[360px] gap-y-2">
          <FormField
            ref={register({
              required: t('required'),
              validate: val => val === passwordValue || t('mustBeEqualToPasswordAbove')
            })}
            label={t('repeatPassword')}
            id="exportfile-repassword"
            type="password"
            name="repeatPassword"
            placeholder="********"
            onChange={e => setVerifyPassword(e.target.value)}
            errorCaption={errors.repeatPassword?.message}
            containerClassName="mx-2"
          />

          <p
            className={classNames(
              'h-4 text-green-500 text-xs',
              isValidPassword && passwordValue === verifyPassword ? 'opacity-100' : 'opacity-0'
            )}
          >
            {t('itsAMatch')}
          </p>
        </div>
      </div>

      <T id="continue">
        {message => (
          <FormSubmitButton
            className="capitalize w-full justify-center mt-6"
            style={{
              fontSize: '18px',
              lineHeight: '24px',
              paddingLeft: '0.5rem',
              paddingRight: '0.5rem',
              paddingTop: '12px',
              paddingBottom: '12px'
            }}
            type="submit"
            disabled={!formState.isValid || !isValidPassword}
            onClick={onSubmit}
          >
            {message}
          </FormSubmitButton>
        )}
      </T>
    </div>
  );
};

export default ExportFilePassword;
