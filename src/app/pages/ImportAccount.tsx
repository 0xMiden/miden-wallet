import React, { FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import Alert from 'app/atoms/Alert';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import PageLayout from 'app/layouts/PageLayout';
import { useMidenContext, useAllAccounts } from 'lib/miden/front';
import { navigate } from 'lib/woozie';

import { clearClipboard } from '../../lib/ui/util';

type ImportAccountProps = {
  tabSlug: string | null;
};

const ImportAccount: FC<ImportAccountProps> = ({ tabSlug }) => {
  const { t } = useTranslation();
  const allAccounts = useAllAccounts();
  const { updateCurrentAccount } = useMidenContext();

  const prevAccLengthRef = useRef(allAccounts.length);
  useEffect(() => {
    const accLength = allAccounts.length;
    if (prevAccLengthRef.current < accLength) {
      updateCurrentAccount(allAccounts[accLength - 1].publicKey);
      navigate('/');
    }
    prevAccLengthRef.current = accLength;
  }, [allAccounts, updateCurrentAccount]);

  return (
    <PageLayout
      pageTitle={
        <>
          <span className="capitalize">{t('importAccount')}</span>
        </>
      }
    >
      <div className="p-4">
        <ByPrivateKeyForm />
      </div>
    </PageLayout>
  );
};

export default ImportAccount;

interface ByPrivateKeyFormData {
  privateKey: string;
  encPassword?: string;
}

const ByPrivateKeyForm: FC = () => {
  const { t } = useTranslation();
  const { importPublicAccountByPrivateKey } = useMidenContext();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ByPrivateKeyFormData>();
  const [error, setError] = useState<ReactNode>(null);

  const onSubmit = useCallback(
    async ({ privateKey }: ByPrivateKeyFormData) => {
      if (isSubmitting) return;

      setError(null);
      try {
        await importPublicAccountByPrivateKey(privateKey);
      } catch (err: any) {
        console.error(err);

        // Human delay
        await new Promise(r => setTimeout(r, 300));
        setError(err.message);
      }
    },
    [importPublicAccountByPrivateKey, isSubmitting, setError]
  );

  return (
    <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleSubmit(onSubmit)} style={{ minHeight: '325px' }}>
      {error && <Alert type="error" title={t('error')} autoFocus description={error} className="mb-6" />}

      <FormField
        {...register('privateKey', { required: t('required') })}
        secret
        textarea
        rows={1}
        name="privateKey"
        id="importacc-privatekey"
        label={
          <div className="font-medium -mb-2" style={{ fontSize: '14px', lineHeight: '20px' }}>
            {t('privateKey')}
          </div>
        }
        placeholder={'eg. 3b6a27bccebfb65e3...'}
        errorCaption={errors.privateKey?.message}
        className="resize-none"
        onPaste={() => clearClipboard()}
      />
      <div className="mb-6 text-gray-200" style={{ fontSize: '12px', lineHeight: '16px' }}>
        {t('privateKeyInputDescription')}
      </div>
      <FormSubmitButton
        className="capitalize w-full justify-center"
        style={{
          fontSize: '18px',
          lineHeight: '24px',
          paddingLeft: '0.5rem',
          paddingRight: '0.5rem',
          paddingTop: '12px',
          paddingBottom: '12px'
        }}
        loading={isSubmitting}
      >
        {t('importAccount')}
      </FormSubmitButton>
    </form>
  );
};
