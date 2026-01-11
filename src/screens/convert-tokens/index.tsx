import React, { HTMLAttributes, useCallback, useEffect, useMemo } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import classNames from 'clsx';
import { FieldError, SubmitHandler, useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Navigator, NavigatorProvider, Route, useNavigator } from 'components/Navigator';

import { ConfirmationScreen } from './Confirmation';
import { FeeOptionsScreen } from './FeeOptions';
import { ReviewScreen } from './Review';
import { TransactionOptionsScreen } from './TransactionOptions';
import {
  ConvertTokensAction,
  ConvertTokensActionId,
  ConvertTokensStep,
  UIBalance,
  UIFeeType,
  UIFees,
  UIForm,
  UIRecords,
  UIToken,
  UITransactionType
} from './types';

// duplicated from /lib/miden/assets to allow storybook to work
const ALEO_TOKEN_ID = 'defaultaleotokenid';

const routes: Route[] = [
  {
    name: ConvertTokensStep.TransactionOptions,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: ConvertTokensStep.Review,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: ConvertTokensStep.Confirmation,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: ConvertTokensStep.FeeOptions,
    animationIn: 'present',
    animationOut: 'dismiss'
  }
];

const validations = {
  amount: yup.string().required(),
  sendType: yup.string().required(),
  receiveType: yup.string().required(),
  feeAmount: yup.string().required('Fee is required'),
  token: yup.object().required()
};

const schema = yup
  .object<UIForm>()
  .shape(validations, [['amount', 'feeAmount']])
  .test('combined-amount', 'Insufficient funds', function (this, values) {
    let { amount, feeAmount, sendType, token } = values;
    const tokenData = token as UIToken;
    let total = parseFloat(amount);
    if (tokenData.id === ALEO_TOKEN_ID) {
      total += parseFloat(feeAmount);
    }
    const isValid =
      total <= (sendType === UITransactionType.Public ? tokenData.publicBalance : tokenData.privateBalance);
    if (!isValid) {
      return this.createError({ path: 'amount', message: 'Insufficient funds' });
    }
    return isValid;
  })
  .required();

export interface IndexScreenProps extends HTMLAttributes<HTMLDivElement> {
  aleoBalance?: UIBalance;
  aleoTokenId: string;
  records?: UIRecords;
  accountWallet?: string;
  chainId?: string;
  isLoading: boolean;
  token: UIToken;
  recommendedFees: UIFees;
  onClose?: () => void;
  onNavigateTo?: (url: 'buy-tokens' | 'transfer-tokens' | 'faucet') => void;
  onSubmitForm?: (data: UIForm) => Promise<boolean>;
}

const IndexScreen: React.FC<IndexScreenProps> = ({
  className,
  aleoBalance = {
    public: 0,
    private: 0
  },
  aleoTokenId,
  records = {
    public: 0,
    private: 0
  },
  accountWallet,
  isLoading,
  chainId,
  token,
  recommendedFees,
  onClose,
  onSubmitForm,
  onNavigateTo,
  ...props
}) => {
  const { navigateTo, goBack } = useNavigator();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<UIForm>({
    defaultValues: {
      amount: undefined,
      sendType: token.privateBalance > token.publicBalance ? UITransactionType.Private : UITransactionType.Public,
      receiveType: token.privateBalance > token.publicBalance ? UITransactionType.Public : UITransactionType.Private,
      token: token,
      feeAmount: token.privateBalance > token.publicBalance ? recommendedFees.private : recommendedFees.public,
      feeType: UIFeeType.Public,
      delegateTransaction: true
    },
    resolver: yupResolver(schema),
    context: {
      chainId
    }
  });

  useEffect(() => {
    register('token');
    register('amount');
    register('sendType');
    register('receiveType');
    register('feeAmount');
    register('feeType');
    register('delegateTransaction');
    register('combined-amount');
  }, [register]);

  const amount = watch('amount');
  const sendType = watch('sendType');
  const receiveType = watch('receiveType');
  const feeAmount = watch('feeAmount');
  const feeType = watch('feeType');
  const delegateTransaction = watch('delegateTransaction');

  const recommendedFee = useMemo(
    () => (sendType === UITransactionType.Private ? recommendedFees.private : recommendedFees.public),
    [recommendedFees, sendType]
  );

  useEffect(() => {
    setValue('feeAmount', recommendedFee);
  }, [recommendedFee, setValue]);

  const onAction = useCallback(
    (action: ConvertTokensAction) => {
      switch (action.id) {
        case ConvertTokensActionId.Navigate:
          navigateTo(action.step);
          break;

        case ConvertTokensActionId.GoBack:
          goBack();
          break;

        case ConvertTokensActionId.OpenUrl:
          onNavigateTo?.(action.url);
          break;
        case ConvertTokensActionId.SetFormValues:
          Object.entries(action.payload).forEach(([key, value]) => {
            setValue(key as keyof UIForm, value);
          });
          if (action.triggerValidation) {
            trigger();
          }
          break;
        case ConvertTokensActionId.Finish:
          onClose?.();
          break;

        default:
          break;
      }
    },
    [onNavigateTo, onClose, setValue, trigger, goBack, navigateTo]
  );

  const onSubmit = useCallback<SubmitHandler<UIForm>>(
    async data => {
      if (isSubmitting) {
        return;
      }
      try {
        await onSubmitForm?.(data);
        onAction({ id: ConvertTokensActionId.Navigate, step: ConvertTokensStep.Confirmation });
      } catch (e: any) {
        if (e.message) {
          setError('root', { type: 'manual', message: e.message });
        }
        console.error(e);
      }
    },
    [isSubmitting, onAction, onSubmitForm, setError]
  );

  const firstError = useMemo(() => {
    const errorEntries = Object.entries(errors);
    if (errorEntries.length > 0) {
      return (errorEntries[0][1] as FieldError).message?.toString();
    }
    return undefined;
  }, [errors]);

  const renderRoute = useCallback(
    (route: Route) => {
      switch (route.name) {
        case ConvertTokensStep.TransactionOptions:
          return (
            <TransactionOptionsScreen
              onAction={onAction}
              aleoTokenId={aleoTokenId}
              amount={amount}
              records={records}
              feeAmount={feeAmount}
              token={token}
              sendType={sendType}
              receiveType={receiveType}
              error={errors.amount?.type === 'optionality' ? undefined : errors.amount?.message?.toString()}
              isValid={validations.amount.isValidSync(amount) && !errors.amount}
            />
          );
        case ConvertTokensStep.Review:
          return (
            <ReviewScreen
              amount={amount}
              token={token}
              sendType={sendType}
              receiveType={receiveType}
              feeType={feeType}
              feeAmount={feeAmount}
              sendAddress={accountWallet || ''}
              delegateTransaction={delegateTransaction}
              isLoading={isLoading || isSubmitting}
              isValid={errors.amount?.message === undefined}
              error={firstError}
              onAction={onAction}
            />
          );
        case ConvertTokensStep.Confirmation:
          return <ConfirmationScreen onAction={onAction} />;
        case ConvertTokensStep.FeeOptions:
          return (
            <FeeOptionsScreen
              fee={feeAmount}
              feeType={feeType}
              aleoBalance={aleoBalance}
              recommendedFee={feeAmount}
              onAction={onAction}
              error={errors.feeAmount?.message?.toString() || errors.amount?.message?.toString()}
            />
          );
        default:
          return null;
      }
    },
    [
      onAction,
      isSubmitting,
      sendType,
      receiveType,
      records,
      aleoBalance,
      feeType,
      feeAmount,
      amount,
      accountWallet,
      isLoading,
      errors,
      delegateTransaction,
      firstError,
      token,
      aleoTokenId
    ]
  );

  return (
    <div
      {...props}
      className={classNames(
        'w-[22.5rem] h-[37.5rem] md:w-[37.5rem] md:h-[46.875rem] md:my-8',
        'mx-auto border rounded-md overflow-hidden ',
        'flex flex-1',
        'flex-col bg-white',
        'rounded-3xl',
        'overflow-hidden relative',
        className
      )}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex">
        <Navigator renderRoute={renderRoute} initialRouteName={routes[0].name} />
      </form>
    </div>
  );
};

const NavigatorWrapper: React.FC<IndexScreenProps> = props => {
  return (
    <NavigatorProvider routes={routes} initialRouteName={ConvertTokensStep.TransactionOptions}>
      <IndexScreen {...props} />
    </NavigatorProvider>
  );
};

export { NavigatorWrapper as IndexScreen };
