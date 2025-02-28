import React, { FC, useCallback, useEffect, useRef } from 'react';

import { OnSubmit, useForm } from 'react-hook-form';

import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { ReactComponent as InfoIcon } from 'app/icons/info-alert.svg';
import AccountBanner from 'app/templates/AccountBanner';
import { useMidenContext, useAccount } from 'lib/miden/front';
import { T, t } from 'lib/i18n/react';
import { navigate } from 'lib/woozie';

const SUBMIT_ERROR_TYPE = 'submit-error';

type FormData = {
  password: string;
};

const RemoveAccount: FC = () => {
  const { removeAccount } = useMidenContext();
  const account = useAccount();

  const prevAccLengthRef = useRef(1);
  useEffect(() => {
    const accLength = 1;
    if (prevAccLengthRef.current > accLength) {
      navigate('/');
    }
    prevAccLengthRef.current = accLength;
  }, []);

  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ password }) => {
      if (submitting) return;

      clearError('password');
      try {
        await removeAccount(account.publicKey, password);
      } catch (err: any) {
        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError('password', SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, setError, removeAccount, account.publicKey]
  );

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      <AccountBanner
        labelDescription={
          <>
            <T id="accountToBeRemoved" />
            <br />
            <T id="ifYouWantToRemoveAnotherAccount" />
          </>
        }
        className="mb-6"
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField
          ref={register({ required: t('required') })}
          label={t('password')}
          labelDescription={t('enterPasswordToRemoveAccount')}
          id="removeacc-secret-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password?.message}
          containerClassName="mb-4"
        />

        <T id="remove">
          {message => (
            <FormSubmitButton
              loading={submitting}
              disabled={submitting}
              className="capitalize w-full justify-center mt-6"
              style={{
                fontSize: '18px',
                lineHeight: '24px',
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem',
                paddingTop: '12px',
                paddingBottom: '12px'
              }}
              testID="RemoveAccount/RemoveAccountButton"
            >
              {message}
            </FormSubmitButton>
          )}
        </T>
      </form>
    </div>
  );
};

export default RemoveAccount;
