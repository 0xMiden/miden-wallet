import FormField, { PASSWORD_ERROR_CAPTION } from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { T } from 'lib/i18n/react';
import React, { FC } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

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

  const { register, handleSubmit, formState, errors } = useForm<FormData>({
    mode: 'onChange' // Validate on change
  });

  const onSubmit = () => {
    onGoNext();
  };

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      <div className="flex flex-col items-center">
        <p className="text-sm text-center font-normal mt-2 w-[500px]">
          Enter a password to encrypt your wallet file. You'll need this password to restore your wallet later.
        </p>
      </div>

      <div className="flex flex-col mt-8 mb-4">
        <FormField
          ref={register({
            required: PASSWORD_ERROR_CAPTION
          })}
          label={t('password')}
          id="newwallet-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password?.message}
          onChange={handlePasswordChange}
          containerClassName="mx-2"
          value={passwordValue}
        />

        <FormField
          ref={register({
            required: t('required'),
            validate: val => val === passwordValue || t('mustBeEqualToPasswordAbove')
          })}
          label={t('repeatPassword')}
          id="newwallet-repassword"
          type="password"
          name="repeatPassword"
          placeholder="********"
          errorCaption={errors.repeatPassword?.message}
          containerClassName="mx-2"
        />
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
            disabled={!formState.isValid}
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
