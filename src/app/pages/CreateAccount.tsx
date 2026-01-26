import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'clsx';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { ACCOUNT_NAME_PATTERN } from 'app/defaults';
import { ReactComponent as ArrowRightIcon } from 'app/icons/arrow-right.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useMidenContext, useAllAccounts } from 'lib/miden/front';
import { navigate } from 'lib/woozie';
import { WalletType } from 'screens/onboarding/types';

type FormData = {
  name: string;
  walletType: WalletType;
};

const WalletTypeOptions = [
  {
    id: WalletType.OnChain,
    title: 'On-chain Account (Public)',
    description: 'Use an existing 12 word recovery phrase. You can also import wallets from other wallet providers.'
  },
  {
    id: WalletType.OffChain,
    title: 'Off-chain Account (Private)',
    description: 'Fast, private operations with minimal fees, bypassing direct blockchain interaction.'
  }
];

const SUBMIT_ERROR_TYPE = 'submit-error';

const CreateAccount: FC = () => {
  const { t } = useTranslation();
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType>(WalletType.OnChain);
  const { createAccount, updateCurrentAccount } = useMidenContext();
  const allAccounts = useAllAccounts();

  const computedDefaultName = useMemo(() => {
    if (selectedWalletType === WalletType.OnChain) {
      return `Pub Account ${allAccounts.filter(acc => acc.isPublic).length + 1}`;
    } else {
      return `Priv Account ${allAccounts.filter(acc => !acc.isPublic).length + 1}`;
    }
  }, [allAccounts, selectedWalletType]);

  const prevAccLengthRef = useRef(allAccounts.length);
  useEffect(() => {
    async function updateAccount() {
      const accLength = allAccounts.length;
      if (prevAccLengthRef.current < accLength) {
        await updateCurrentAccount(allAccounts[accLength - 1].accountId);
        navigate('/');
      }
      prevAccLengthRef.current = accLength;
    }
    updateAccount();
  }, [allAccounts, updateCurrentAccount]);

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: { name: computedDefaultName }
  });

  useEffect(() => {
    setValue('name', computedDefaultName);
  }, [computedDefaultName, setValue]);

  const handleWalletTypeSelect = (type: WalletType) => {
    setSelectedWalletType(type);
  };

  const onSubmit = useCallback<SubmitHandler<FormData>>(
    async ({ name, walletType }) => {
      if (isSubmitting) return;

      clearErrors('name');

      try {
        await createAccount(selectedWalletType, name);
      } catch (err: any) {
        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError('name', { type: SUBMIT_ERROR_TYPE, message: err.message });
      }
    },
    [isSubmitting, clearErrors, setError, createAccount, selectedWalletType]
  );

  return (
    <PageLayout pageTitle={<>{t('createAccount')}</>}>
      <div className="w-full max-w-sm mx-auto px-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormField
            {...register('name', {
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
            placeholder={computedDefaultName}
            errorCaption={errors.name?.message}
            autoFocus
          />
          <div className="text-gray-200 mb-8" style={{ fontSize: '12px', lineHeight: '16px' }}>
            {t('accountNameInputDescription')}
          </div>

          {/* Wallet Type Selection */}
          <div className="mb-8">
            <div className="font-medium mb-4" style={{ fontSize: '14px', lineHeight: '20px' }}>
              {t('chooseYourAccountType')}
            </div>
            {WalletTypeOptions.map((option, idx) => (
              <div
                key={option.id}
                className={classNames('flex flex-col border p-4 rounded-lg cursor-pointer', 'w-full', 'mb-4', {
                  'bg-blue-100': selectedWalletType === option.id // Highlight if selected
                })}
                onClick={() => handleWalletTypeSelect(option.id)}
              >
                <div className="flex flex-row justify-between items-center">
                  <h3 className="font-medium text-base">{option.title}</h3>
                  <ArrowRightIcon fill="black" height="20px" width="20px" />
                </div>
                <p className="text-grey-600">{option.description}</p>
              </div>
            ))}
          </div>

          <FormSubmitButton
            className="capitalize w-full justify-center"
            loading={isSubmitting}
            style={{
              fontSize: '18px',
              lineHeight: '24px',
              paddingLeft: '0.5rem',
              paddingRight: '0.5rem',
              paddingTop: '12px',
              paddingBottom: '12px'
            }}
          >
            {t('createAccount')}
          </FormSubmitButton>
        </form>
      </div>
    </PageLayout>
  );
};

export default CreateAccount;
