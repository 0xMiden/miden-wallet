import React, { FC, FocusEventHandler, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';

import AssetField from 'app/atoms/AssetField';
import { Button } from 'app/atoms/Button';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { useAppEnv } from 'app/env';
import { ALEO_SLUG, ALEO_TOKEN_ID } from 'lib/miden/assets/constants';
import { useAccount, useBalance, useFee } from 'lib/miden/front';
import { ALEO_DECIMALS, ALEO_MICROCREDITS_TO_CREDITS } from 'lib/fiat-curency/consts';
import { formatBigInt } from 'lib/i18n/numbers';
import { T, t } from 'lib/i18n/react';
import { useAlert } from 'lib/ui/dialog';

interface FormData {
  amount: string;
}

type FormProps = {
  fee: bigint;
  feePrivate: boolean;
  recommendedFee: bigint;
  allowOneCreditRecord: boolean;
  setFee: (amount: bigint) => void;
  setFeePrivate: (feePrivate: boolean) => void;
  cancel: () => void;
  submitAction?: string;
};

const Form: FC<FormProps> = ({
  fee,
  feePrivate,
  recommendedFee,
  allowOneCreditRecord,
  setFee,
  setFeePrivate,
  cancel,
  submitAction
}) => {
  const { registerBackHandler } = useAppEnv();
  const { fullPage } = useAppEnv();

  const account = useAccount();

  const [privateFeeEnabled, setPrivateFeeEnabled] = useState(true);
  const [publicFeeEnabled, setPublicFeeEnabled] = useState(true);

  useLayoutEffect(() => {
    return registerBackHandler(() => {
      cancel();
    });
  }, [registerBackHandler, cancel]);

  const assetSymbol = 'ALEO';

  const alert = useAlert();

  useEffect(() => {
    let enablePrivate = true;
    let enablePublic = true;

    // if (isLoadingFee || isLoadingPublic) {
    //   return;
    // }

    // if (!privateAleoBalance || privateAleoBalance === BigInt(0)) {
    //   enablePrivate = false;
    // }

    // if (!publicAleoBalance || publicAleoBalance.isEqualTo(new BigNumber(0))) {
    //   enablePublic = false;
    // }

    if (!enablePrivate && !enablePublic) {
      alert({
        title: 'Cannot send transaction',
        children: (
          <>
            <div>{'You do not have a sufficient balance'}</div>
            <div>
              {'Request the faucet. '}
              <br />
              <a href="https://link.leo.app/CannotSend" className="cursor">
                Learn more here
              </a>
            </div>
          </>
        )
      });
    }
    setPrivateFeeEnabled(enablePrivate);
    setPublicFeeEnabled(enablePublic);
    if (!enablePrivate) {
      setFeePrivate(false);
    }
  }, [alert, setFeePrivate]);

  /**
   * Form
   */

  const { handleSubmit, errors, control, formState, triggerValidation } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: { amount: formatBigInt(fee, ALEO_DECIMALS) }
  });

  const amountFieldRef = useRef<HTMLInputElement>(null);
  const publicBalanceAsNumber = 1;
  const aleoFee = BigInt(publicBalanceAsNumber);

  const validateAmount = useCallback(
    (v?: number) => {
      if (v === undefined) return t('required');

      const microCredits = Math.round(v * ALEO_MICROCREDITS_TO_CREDITS);
      const vBN = BigInt(microCredits);
      if (vBN <= BigInt(0)) {
        return t('amountMustBePositive');
      }
      if (!aleoFee) return true;
      return vBN <= aleoFee || t('maximalAmount', formatBigInt(aleoFee, ALEO_DECIMALS));
    },
    [aleoFee]
  );

  const maxAmountStr = aleoFee?.toString();
  useEffect(() => {
    if (formState.dirtyFields.has('amount')) {
      triggerValidation('amount');
    }
  }, [formState.dirtyFields, triggerValidation, maxAmountStr]);

  const handleAmountFieldFocus = useCallback<FocusEventHandler>(evt => {
    evt.preventDefault();
    amountFieldRef.current?.focus({ preventScroll: true });
  }, []);

  const onSubmit = useCallback(
    async ({ amount }: FormData) => {
      if (formState.isSubmitting) return;

      try {
        setFee(BigInt(Math.round(Number(amount) * ALEO_MICROCREDITS_TO_CREDITS)));
      } catch (err: any) {
        if (err.message === 'Declined') {
          return;
        }

        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
      }
    },
    [formState.isSubmitting, setFee]
  );

  const enabledStyle = { cursor: 'pointer' };
  const disabledStyle = { cursor: 'not-allowed' };

  return (
    <form style={{ minHeight: '24rem' }} onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="amount"
        as={<AssetField ref={amountFieldRef} onFocus={handleAmountFieldFocus} showMax={false} />}
        control={control}
        rules={{
          validate: validateAmount
        }}
        onChange={([v]) => v}
        onFocus={() => amountFieldRef.current?.focus()}
        id="send-amount"
        assetSymbol={assetSymbol}
        assetDecimals={6}
        placeholder={'0.00'}
        errorCaption={errors.amount?.message}
        containerClassName="mb-2"
        className="text-sm"
        label={
          <div className="font-medium mt-4 -mb-1" style={{ fontSize: '14px', lineHeight: '20px' }}>
            {t('fee')}
          </div>
        }
      />
      <div className="flex justify-between -mt-2 mb-4" style={{ fontSize: '12px', lineHeight: '16px' }}>
        <div className="flex justify-start mb-4" style={{ fontSize: '12px', lineHeight: '16px' }}>
          <span className="text-gray-200">{`${t('recommended')}:`}&nbsp;</span>
          <span className="text-black">{`${formatBigInt(recommendedFee, ALEO_DECIMALS)} ${assetSymbol}`}</span>
        </div>
      </div>
      <div>
        <span className="text-black font-medium">
          <div className="font-medium mt-4 mb-2" style={{ fontSize: '14px', lineHeight: '20px' }}>
            {t('feeVisibility')}
          </div>
        </span>
        <div className="flex mt-1 mb-1">
          <label className="radio-container" style={privateFeeEnabled ? enabledStyle : disabledStyle}>
            <input
              type="radio"
              value="Private"
              checked={feePrivate}
              onChange={() => privateFeeEnabled && setFeePrivate(true)}
            />
            <span className="checkmark"></span>
          </label>
          <span className="ml-2" style={{ fontSize: '14px', lineHeight: '24px' }}>
            {t('private')}
          </span>
        </div>
        <div className="flex">
          <label className="radio-container" style={publicFeeEnabled ? enabledStyle : disabledStyle}>
            <input
              type="radio"
              value="Public"
              checked={!feePrivate}
              onChange={() => publicFeeEnabled && setFeePrivate(false)}
            />
            <span className="checkmark"></span>
          </label>
          <span className="ml-2" style={{ fontSize: '14px', lineHeight: '24px' }}>
            {t('public')}
          </span>
        </div>
      </div>
      <div className={`flex flex-col justify-end w-full bottom-0 left-0 px-4 mb-6 ${fullPage ? 'absolute' : 'fixed'}`}>
        <div className="flex flex-row justify-between w-full max-w-sm mx-auto">
          <T id="cancel">
            {message => (
              <Button
                className={classNames(
                  'justify-center',
                  'px-8',
                  'rounded-lg',
                  'bg-gray-800',
                  'hover:bg-gray-700',
                  'active:bg-gray-600',
                  'flex items-center',
                  'text-black',
                  'font-semibold',
                  'transition duration-200 ease-in-out'
                )}
                style={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  padding: '14px 0px',
                  width: '48%'
                }}
                onClick={cancel}
              >
                {message}
              </Button>
            )}
          </T>
          <T id={submitAction || 'save'}>
            {message => (
              <FormSubmitButton
                loading={formState.isSubmitting}
                className="justify-center rounded-lg py-3"
                style={{ width: '48%', fontSize: '16px', lineHeight: '24px', padding: '14px 0px', border: 'none' }}
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

export default Form;
