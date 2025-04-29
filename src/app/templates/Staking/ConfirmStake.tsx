import React, { FC, Suspense, useCallback } from 'react';

import BigNumber from 'bignumber.js';
import { useForm } from 'react-hook-form';

import { SecondaryButton } from 'app/atoms/ActionButtons';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import HashShortView from 'app/atoms/HashShortView';
import Spinner from 'app/atoms/Spinner/Spinner';
import { openLoadingFullPage, useAppEnv } from 'app/env';
import PreviewTransactionAmount from 'app/templates/PreviewTransactionAmount';
import { ALEO_DECIMALS, ALEO_MICROCREDITS_TO_CREDITS } from 'lib/fiat-curency/consts';
import { formatBigInt } from 'lib/i18n/numbers';
import { t, T } from 'lib/i18n/react';
import { useAccount, useMidenContext } from 'lib/miden/front';
import Link from 'lib/woozie/Link';

import { isDelegateProofEnabled } from '../DelegateSettings';
import { StakeFormSelectors } from '../StakeForm.selectors';

type StakeAction = 'stake' | 'unstake';

interface FormData {
  amount: string;
  fee: number;
  feePrivate: boolean;
}

type ConfirmStakeFormProps = {
  amount: bigint;
  fee: bigint;
  feePrivate: boolean;
  validator: string;
  setConfirmStatus: (delegated: boolean) => void;
  initiateTransaction: (
    programId: string,
    amount: bigint,
    fee: bigint,
    feePrivate: boolean,
    delegate: boolean,
    validator?: string
  ) => void;
  assetSlug?: string | null;
  action: StakeAction;
};

const ConfirmStakeForm: FC<ConfirmStakeFormProps> = ({
  action,
  amount,
  fee,
  feePrivate,
  validator,
  assetSlug = 'aleo',
  setConfirmStatus,
  initiateTransaction
}) => {
  return (
    <>
      <Suspense fallback={<SpinnerSection />}>
        <Form
          setConfirmStatus={setConfirmStatus}
          initiateTransaction={initiateTransaction}
          assetSlug={assetSlug!}
          amount={amount}
          fee={fee}
          feePrivate={feePrivate}
          validator={validator}
          action={action}
        />
      </Suspense>
    </>
  );
};

export default ConfirmStakeForm;

type FormProps = {
  amount: bigint;
  fee: bigint;
  feePrivate: boolean;
  validator: string;
  setConfirmStatus: (delegated: boolean) => void;
  initiateTransaction: (
    programId: string,
    amount: bigint,
    fee: bigint,
    feePrivate: boolean,
    delegate: boolean,
    validator?: string
  ) => void;
  assetSlug: string;
  action: StakeAction;
};

const Form: FC<FormProps> = ({
  amount,
  fee,
  feePrivate,
  validator,
  setConfirmStatus,
  initiateTransaction,
  assetSlug,
  action
}) => {
  const account = useAccount();
  const { fullPage } = useAppEnv();
  const assetSymbol = assetSlug.toUpperCase() || 'ALEO';
  const delegateTransaction = isDelegateProofEnabled();
  // const { authorizeTransaction } = useMidenContext();

  /**
   * Form
   */

  const { handleSubmit, formState } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {}
  });

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;

    try {
      // Open generating page to process it
      if (!delegateTransaction) await openLoadingFullPage();
      setConfirmStatus(delegateTransaction);
    } catch (err: any) {
      if (err.message === 'Declined') {
        return;
      }

      console.error(err);

      // Human delay.
      await new Promise(res => setTimeout(res, 300));
    }
  }, [
    amount,
    account,
    formState.isSubmitting,
    setConfirmStatus,
    initiateTransaction,
    fee,
    feePrivate,
    validator,
    delegateTransaction
    // authorizeTransaction
  ]);

  const amountFormatted = new BigNumber(Number(amount) / ALEO_MICROCREDITS_TO_CREDITS);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="pt-2 flex flex-col">
        <PreviewTransactionAmount amount={amountFormatted} assetSymbol={assetSymbol} />
        <div className="flex flex-col mt-4 py-2 border-t border-gray-700">
          <div className="flex flex-row justify-between text-sm my-2">
            <span className="text-gray-200">{t('stakeAccount')}</span>
            <span className="text-black">
              {`${account.name} (`}
              <HashShortView hash={account.publicKey} />
              {`)`}
            </span>
          </div>
          <div className="flex flex-row justify-between text-sm my-2">
            <span className="text-gray-200">{t('fee')}</span>
            <span style={{ wordBreak: 'break-all' }}>
              {formatBigInt(fee, ALEO_DECIMALS)} {assetSymbol}
            </span>
          </div>
        </div>
      </div>
      <div className={`flex flex-col justify-end w-full bottom-0 left-0 px-4 mb-6 ${fullPage ? 'absolute' : 'fixed'}`}>
        <div className="flex flex-row justify-between w-full max-w-sm mx-auto">
          <T id="cancel">
            {message => (
              <Link to="/tokens/aleo" style={{ width: '48%' }} testID={StakeFormSelectors.CancelConfirmButton}>
                <SecondaryButton>{message}</SecondaryButton>
              </Link>
            )}
          </T>
          <T id={action}>
            {message => (
              <FormSubmitButton
                loading={formState.isSubmitting}
                className="justify-center rounded-lg py-3"
                style={{ width: '48%', fontSize: '16px', lineHeight: '24px', padding: '14px 0px', border: 'none' }}
                testID={StakeFormSelectors.ConfirmButton}
              >
                {message}
              </FormSubmitButton>
            )}
          </T>
        </div>
      </div>
    </form>
  );
};

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-8">
    <Spinner />
  </div>
);
