import React, { FC, useCallback, useEffect, useMemo, useRef } from 'react';

import { OnSubmit, useForm } from 'react-hook-form';

import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { ACCOUNT_NAME_PATTERN } from 'app/defaults';
import PageLayout from 'app/layouts/PageLayout';
import { useMidenClient, useAllAccounts } from 'lib/miden/front';
import { useFormAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import { navigate } from 'lib/woozie';

type FormData = {
  name: string;
};

const SUBMIT_ERROR_TYPE = 'submit-error';

const CreateAccount: FC = () => {
  const { createAccount, updateCurrentAccount } = useMidenClient();
  const allAccounts = useAllAccounts();
  const formAnalytics = useFormAnalytics('CreateAccount');

  const defaultName = 'defaultAccountName';

  const prevAccLengthRef = useRef(1);
  useEffect(() => {
    async function updateAccount() {
      const accLength = 1;
      if (prevAccLengthRef.current < accLength) {
        await updateCurrentAccount(allAccounts[accLength - 1].publicKey);
        navigate('/');
      }
      prevAccLengthRef.current = accLength;
    }
    updateAccount();
  }, [allAccounts, updateCurrentAccount]);

  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>({
    defaultValues: { name: defaultName }
  });
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ name }) => {
      if (submitting) return;

      clearError('name');

      formAnalytics.trackSubmit();
      try {
        await createAccount(name);

        formAnalytics.trackSubmitSuccess();
      } catch (err: any) {
        formAnalytics.trackSubmitFail();

        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError('name', SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [submitting, clearError, setError, createAccount, formAnalytics]
  );

  return (
    <PageLayout
      pageTitle={
        <>
          <T id="createAccount" />
        </>
      }
    >
      <div className="w-full max-w-sm mx-auto mt-6 px-4" style={{ height: '420px' }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            ref={register({
              pattern: {
                value: ACCOUNT_NAME_PATTERN,
                message: t('accountNameInputTitle')
              }
            })}
            label={
              <div className="font-medium -mb-2" style={{ fontSize: '14px', lineHeight: '20px' }}>
                {t('accountName')}
              </div>
            }
            id="create-account-name"
            type="text"
            name="name"
            placeholder={defaultName}
            errorCaption={errors.name?.message}
          />
          <div className="text-gray-200 mb-8" style={{ fontSize: '12px', lineHeight: '16px' }}>
            {t('accountNameInputDescription')}
          </div>

          <T id="createAccount">
            {message => (
              <FormSubmitButton
                className="capitalize w-full justify-center"
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
      </div>
    </PageLayout>
  );
};

export default CreateAccount;
