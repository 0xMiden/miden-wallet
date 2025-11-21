import React, { FC, useCallback, useLayoutEffect, useMemo, useRef } from 'react';

import { OnSubmit, useForm } from 'react-hook-form';

import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import useMidenFaucetId from 'app/hooks/useMidenFaucetId';
import { t, T } from 'lib/i18n/react';
import { setFaucetIdSetting } from 'lib/miden/assets';

const SUBMIT_ERROR_TYPE = 'submit-error';

type FormData = {
  faucetId: string;
};

const EditMidenFaucetId: FC = () => {
  const faucetId = useMidenFaucetId();
  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const formRef = useRef<HTMLFormElement>(null);
  const focusFaucetIdField = useCallback(() => {
    formRef.current?.querySelector<HTMLInputElement>("input[name='faucetId']")?.focus();
  }, []);

  useLayoutEffect(() => {
    focusFaucetIdField();
  }, [focusFaucetIdField]);

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ faucetId }) => {
      if (submitting) return;
      clearError('faucetId');

      try {
        setFaucetIdSetting(faucetId);
      } catch (err: any) {
        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError('faucetId', SUBMIT_ERROR_TYPE, err.message);
        focusFaucetIdField();
      }
    },
    [submitting, clearError, setError, focusFaucetIdField]
  );

  const content = useMemo(() => {
    return (
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <FormField
          ref={register({ required: t('required') })}
          label={t('faucetId')}
          labelDescription={t('setNewFaucetIdDescription')}
          id="set-faucet-id"
          type="text"
          name="faucetId"
          placeholder={faucetId}
          errorCaption={errors.faucetId?.message}
          containerClassName="mb-4"
          onChange={() => clearError()}
        />

        <T id="setNewFaucetId">
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
            >
              {message}
            </FormSubmitButton>
          )}
        </T>
      </form>
    );
  }, [faucetId, errors, handleSubmit, onSubmit, register, submitting, clearError]);

  return <div className="w-full max-w-sm p-2 mx-auto">{content}</div>;
};

export default EditMidenFaucetId;
