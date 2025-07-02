import React, { FC, FocusEventHandler, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import { Controller, useForm } from 'react-hook-form';

import { SecondaryButton } from 'app/atoms/ActionButtons';
import AssetField from 'app/atoms/AssetField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import CustomizeFee from 'app/templates/CustomizeFee';
import { ALEO_DECIMALS, ALEO_MICROCREDITS_TO_CREDITS } from 'lib/fiat-curency';
import { formatBigInt, toLocalFixed } from 'lib/i18n/numbers';
import { T, t } from 'lib/i18n/react';
import { useAlert } from 'lib/ui/dialog';
import useTippy from 'lib/ui/useTippy';
import { Link } from 'lib/woozie';

import { StakeFormSelectors } from '../StakeForm.selectors';

const MINIMUM_INITIAL_STAKE_AMOUNT = BigInt(10_000_000); // Microcredits
const MINIMUM_STAKE_AMOUNT = BigInt(1_000_000); // Microcredits

interface FormData {
  amount: string;
}

type StakeFormProps = {
  setStakeInfo: (amount: bigint, fee: bigint, feePrivate: boolean, validator?: string) => void;
  assetSlug?: string | null;
  balance: BigNumber;
  balanceIsLoading: boolean;
  recommendedFee: bigint;
  isFirstStakingTransaction?: boolean;
};

const StakeForm: FC<React.PropsWithChildren<StakeFormProps>> = ({
  assetSlug = 'aleo',
  setStakeInfo,
  balance,
  balanceIsLoading,
  recommendedFee,
  isFirstStakingTransaction = false,
  children
}) => {
  const [amount, setAmount] = useState<number | undefined>();
  const [fee, setFee] = useState<bigint>(recommendedFee);
  const [feePrivate, setFeePrivate] = useState<boolean>(true);
  const [editingFee, setEditingFee] = useState(false);

  return (
    <>
      <Suspense fallback={<SpinnerSection />}>
        {editingFee && (
          <CustomizeFee
            fee={fee}
            feePrivate={feePrivate}
            recommendedFee={recommendedFee}
            setFee={(amount: bigint) => {
              setFee(amount);
              setEditingFee(false);
            }}
            setFeePrivate={(privateFee: boolean) => {
              setFeePrivate(privateFee);
            }}
            cancel={() => setEditingFee(false)}
          />
        )}
        {!editingFee && (
          <>
            <Form
              amount={amount}
              setAmount={setAmount}
              setStakeInfo={setStakeInfo}
              assetSlug={assetSlug!}
              fee={fee}
              feePrivate={feePrivate}
              editFee={() => setEditingFee(true)}
              balance={balance}
              balanceIsLoading={balanceIsLoading}
              isFirstStakingTransaction={isFirstStakingTransaction}
            />
            {children}
          </>
        )}
      </Suspense>
    </>
  );
};

export default StakeForm;

type FormProps = {
  amount?: number;
  setAmount: (amount: number) => void;
  setStakeInfo: (amount: bigint, fee: bigint, feePrivate: boolean, validator?: string) => void;
  assetSlug: string;
  balance: BigNumber;
  balanceIsLoading: boolean;
  isFirstStakingTransaction: boolean;
  fee: bigint;
  feePrivate: boolean;
  editFee: () => void;
};

const Form: FC<FormProps> = ({
  amount,
  setAmount,
  setStakeInfo,
  assetSlug,
  fee,
  feePrivate,
  editFee,
  balance,
  balanceIsLoading,
  isFirstStakingTransaction
}) => {
  const { fullPage } = useAppEnv();
  const assetSymbol = assetSlug.toUpperCase() || 'ALEO';

  const alert = useAlert();
  const feeRef = useTippy<HTMLSpanElement>(feeTippyPropsMock);

  useEffect(() => {
    let enableTransaction = true;

    if (balanceIsLoading) {
      return;
    }

    const minStakeAmount = Number(MINIMUM_STAKE_AMOUNT) / ALEO_MICROCREDITS_TO_CREDITS;
    const minInitialStakeAmount = Number(MINIMUM_INITIAL_STAKE_AMOUNT) / ALEO_MICROCREDITS_TO_CREDITS;
    if (
      !balance ||
      balance.isLessThan(minStakeAmount) ||
      (isFirstStakingTransaction && balance.isLessThan(minInitialStakeAmount))
    ) {
      enableTransaction = false;
    }

    if (!enableTransaction) {
      alert({
        title: 'Cannot send transaction',
        children: (
          <>
            <div>{'You do not have a sufficient public balance'}</div>
            <div>
              {'Request the faucet or transfer from your private balance'}
              <br />
              <a href="https://link.leo.app/CannotSend" className="cursor">
                {t('learnMoreHere')}
              </a>
            </div>
          </>
        )
      });
    }
  }, [alert, balanceIsLoading, balance, isFirstStakingTransaction]);

  /**
   * Form
   */

  const { handleSubmit, errors, control, formState, triggerValidation } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {}
  });

  const amountFieldRef = useRef<HTMLInputElement>(null);
  const maxAmount = balance;

  const validateAmount = useCallback(
    (v?: number) => {
      if (v === undefined) return t('required');

      const vBN = new BigNumber(v);
      if (vBN.isLessThan(1)) {
        return t('amountMustBeGreaterThanOne');
      }
      if (isFirstStakingTransaction && vBN.isLessThan(10)) {
        return t('mustStakeAtLeastTenAleo');
      }
      if (!maxAmount) return true;
      if (vBN.isLessThanOrEqualTo(maxAmount) || t('maximalAmount', toLocalFixed(maxAmount))) {
        setAmount(vBN.toNumber());
        return true;
      }
      return false;
    },
    [maxAmount, setAmount, isFirstStakingTransaction]
  );

  const maxAmountStr = maxAmount?.toString();
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
        const amountBigInt = BigInt(Math.floor(Number(amount) * ALEO_MICROCREDITS_TO_CREDITS));
        setStakeInfo(amountBigInt, fee, feePrivate);
      } catch (err: any) {
        if (err.message === 'Declined') {
          return;
        }

        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
      }
    },
    [formState.isSubmitting, fee, feePrivate, setStakeInfo]
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="amount"
        as={<AssetField ref={amountFieldRef} onFocus={handleAmountFieldFocus} max={balance?.toNumber()} />}
        control={control}
        rules={{
          validate: validateAmount
        }}
        onChange={([v]) => v}
        onFocus={() => amountFieldRef.current?.focus()}
        id="stake-amount"
        assetSymbol={assetSymbol}
        assetDecimals={6}
        placeholder={'0.00'}
        errorCaption={errors.amount?.message}
        containerClassName="mb-2"
        autoFocus={Boolean(maxAmount)}
        className="text-sm"
        defaultValue={amount}
        label={
          <div className="font-medium -mb-1" style={{ fontSize: '14px', lineHeight: '20px' }}>
            {t('amount')}
          </div>
        }
      />
      <div className="flex justify-between -mt-2 mb-4" style={{ fontSize: '12px', lineHeight: '16px' }}>
        <div className="flex justify-start mb-4" style={{ fontSize: '12px', lineHeight: '16px' }}>
          <span className="text-gray-200">{`${t('available')}:`}&nbsp;</span>
          <span className="text-purple-950 font-medium">{`${maxAmount} ${assetSymbol}`}</span>
        </div>
        <div
          className="flex justify-start mb-4 cursor-pointer"
          style={{ fontSize: '12px', lineHeight: '16px' }}
          onClick={editFee}
        >
          <span className="text-gray-200">{`${t('fee')}:`}&nbsp;</span>
          <span ref={feeRef} className="text-black">{`${formatBigInt(fee, ALEO_DECIMALS)} ${assetSymbol}`}</span>
        </div>
      </div>
      <div className={`flex flex-col justify-end w-full bottom-0 left-0 px-4 mb-6 ${fullPage ? 'absolute' : 'fixed'}`}>
        <div className="flex flex-row justify-between w-full max-w-sm mx-auto">
          <T id="cancel">
            {message => (
              <Link to="/tokens/aleo" style={{ width: '48%' }} testID={StakeFormSelectors.CancelButton}>
                <SecondaryButton>{message}</SecondaryButton>
              </Link>
            )}
          </T>
          <T id="preview">
            {message => (
              <FormSubmitButton
                testID={StakeFormSelectors.PreviewButton}
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

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-8">
    <Spinner />
  </div>
);

const feeTippyPropsMock = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('feeToolTip'),
  animation: 'shift-away-subtle'
};
