import React, { FC, useCallback, useLayoutEffect, useState } from 'react';

import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';

import { useMidenContext } from 'lib/miden/front/client';
import { navigate } from 'lib/woozie';
import { WalletType } from 'screens/onboarding/types';

import { AnalyticsEventCategory, useAnalytics, useAnalyticsSettings } from '../../../lib/analytics';
import { T, t } from '../../../lib/i18n/react';
import PasswordStrengthIndicator, { PasswordValidation } from '../../../lib/ui/PasswordStrengthIndicator';
import FormCheckbox from '../../atoms/FormCheckbox';
import FormField, { PASSWORD_ERROR_CAPTION } from '../../atoms/FormField';
import FormSubmitButton from '../../atoms/FormSubmitButton';
import {
  formatMnemonic,
  lettersNumbersMixtureRegx,
  PASSWORD_PATTERN,
  specialCharacterRegx,
  uppercaseLowercaseMixtureRegx
} from '../../defaults';
import { useOnboardingProgress } from '../Onboarding/hooks/useOnboardingProgress.hook';

export const MIN_PASSWORD_LENGTH = 8;

interface FormData {
  shouldUseKeystorePassword?: boolean;
  password?: string;
  repeatPassword?: string;
  termsAccepted: boolean;
  analytics?: boolean;
  skipOnboarding?: boolean;
}

interface SetWalletPasswordProps {
  ownMnemonic?: boolean;
  seedPhrase: string;
  keystorePassword?: string;
}

export const SetWalletPassword: FC<SetWalletPasswordProps> = ({
  ownMnemonic = false,
  seedPhrase,
  keystorePassword
}) => {
  const { registerWallet } = useMidenContext();
  const { trackEvent } = useAnalytics();

  const { setAnalyticsEnabled } = useAnalyticsSettings();
  const { setOnboardingCompleted } = useOnboardingProgress();

  const isImportFromKeystoreFile = Boolean(keystorePassword);

  const isKeystorePasswordWeak = isImportFromKeystoreFile && !PASSWORD_PATTERN.test(keystorePassword!);

  const { control, watch, register, handleSubmit, errors, triggerValidation, formState } = useForm<FormData>({
    defaultValues: { shouldUseKeystorePassword: !isKeystorePasswordWeak, analytics: true, skipOnboarding: true },
    mode: 'onChange'
  });
  const submitting = formState.isSubmitting;

  const shouldUseKeystorePassword = watch('shouldUseKeystorePassword');

  const passwordValue = watch('password');

  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minChar: false,
    cases: false,
    number: false,
    specialChar: false
  });

  useLayoutEffect(() => {
    if (formState.dirtyFields.has('repeatPassword')) {
      triggerValidation('repeatPassword');
    }
  }, [triggerValidation, formState.dirtyFields, passwordValue]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
    const tempValue = e.target.value;
    setPasswordValidation({
      minChar: tempValue.length >= MIN_PASSWORD_LENGTH,
      cases: uppercaseLowercaseMixtureRegx.test(tempValue),
      number: lettersNumbersMixtureRegx.test(tempValue),
      specialChar: specialCharacterRegx.test(tempValue)
    });
  };

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (submitting) return;
      if (shouldUseKeystorePassword && isKeystorePasswordWeak) return;

      const password = ownMnemonic
        ? data.shouldUseKeystorePassword
          ? keystorePassword
          : data.password
        : data.password;
      try {
        setAnalyticsEnabled(data.analytics);
        setOnboardingCompleted(true);

        await registerWallet(WalletType.OnChain, password!, formatMnemonic(seedPhrase), ownMnemonic); // TODO: This will change when import flow is hashed out
        trackEvent(
          'WalletCreated',
          AnalyticsEventCategory.General,
          { ownMnemonic, userAgent: navigator.userAgent },
          data.analytics
        );
        trackEvent(
          data.skipOnboarding ? 'OnboardingSkipped' : 'OnboardingNotSkipped',
          AnalyticsEventCategory.General,
          undefined,
          data.analytics
        );
        navigate('/loading');
      } catch (err: any) {
        console.error(err);

        alert(err.message);
      }
    },
    [
      submitting,
      shouldUseKeystorePassword,
      isKeystorePasswordWeak,
      ownMnemonic,
      keystorePassword,
      setAnalyticsEnabled,
      setOnboardingCompleted,
      registerWallet,
      seedPhrase,
      trackEvent
    ]
  );

  return (
    <form className={classNames('w-full px-4 mx-auto my-4', ownMnemonic && 'pb-4')} onSubmit={handleSubmit(onSubmit)}>
      <h1 className={classNames('mb-2', 'px-2 text-sm text-black font-medium')}>{t('setPassword')}</h1>
      {ownMnemonic && isImportFromKeystoreFile && (
        <div className="w-full mb-6 mt-8">
          <Controller
            control={control}
            name="shouldUseKeystorePassword"
            as={FormCheckbox}
            label={t('useKeystorePassword')}
            onClick={() =>
              setPasswordValidation({
                minChar: false,
                cases: false,
                number: false,
                specialChar: false
              })
            }
          />
          {shouldUseKeystorePassword && isKeystorePasswordWeak && (
            <div className="text-xs text-red-500">
              <T id="weakKeystorePassword" />
            </div>
          )}
        </div>
      )}

      {(!shouldUseKeystorePassword || !isImportFromKeystoreFile) && (
        <>
          <div className="flex mt-8 mb-4">
            <FormField
              ref={register({
                required: PASSWORD_ERROR_CAPTION,
                pattern: {
                  value: PASSWORD_PATTERN,
                  message: PASSWORD_ERROR_CAPTION
                }
              })}
              label={t('password')}
              id="newwallet-password"
              type="password"
              name="password"
              placeholder="********"
              errorCaption={errors.password?.message}
              onChange={handlePasswordChange}
              containerClassName="mx-2"
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

          {passwordValidation && <PasswordStrengthIndicator validation={passwordValidation} />}
        </>
      )}

      <Controller
        control={control}
        name="analytics"
        as={FormCheckbox}
        label={t('analytics')}
        labelDescription={
          <T
            id="analyticsInputDescription"
            substitutions={[
              <T id="analyticsCollecting" key="analyticsLink">
                {message => (
                  <a
                    href="https://leo.app/analytics-collecting"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-secondary"
                  >
                    {message}
                  </a>
                )}
              </T>
            ]}
          />
        }
      />

      <FormCheckbox
        ref={register({
          validate: val => val || t('confirmTermsError')
        })}
        errorCaption={errors.termsAccepted?.message}
        name="termsAccepted"
        label={t('acceptTerms')}
        labelDescription={
          <T
            id="acceptTermsInputDescription"
            substitutions={[
              <T id="termsOfUsage" key="termsLink">
                {message => (
                  <a
                    href="https://leo.app/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-secondary"
                  >
                    {message}
                  </a>
                )}
              </T>,
              <T id="privacyPolicy" key="privacyPolicyLink">
                {message => (
                  <a
                    href="https://leo.app/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-secondary"
                  >
                    {message}
                  </a>
                )}
              </T>
            ]}
          />
        }
        containerClassName="mb-6"
      />

      <div className="flex flex-col px-2 pb-12 max-w-full	items-end">
        <FormSubmitButton
          loading={submitting}
          className="w-full text-base pt-4 mx-auto"
          style={{ display: 'block', fontWeight: 500, padding: '12px 0px' }}
        >
          <T id={ownMnemonic ? 'import' : 'next'} />
        </FormSubmitButton>
      </div>
    </form>
  );
};
