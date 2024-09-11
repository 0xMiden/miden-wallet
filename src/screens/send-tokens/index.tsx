import React, { HTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'clsx';
import { FieldError, OnSubmit, useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Route, Navigator, NavigatorProvider, useNavigator } from 'components/Navigator';

import { AddTokensScreen } from './AddTokens';
import { AdvancedOptionsScreen } from './AdvancedOptions';
import { ConfirmationScreen } from './Confirmation';
import { ContactsListScreen } from './ContactsList';
import { FeeOptionsScreen } from './FeeOptions';
import { NoBalanceScreen } from './NoBalance';
import { ReviewScreen } from './Review';
import { SelectRecipientScreen } from './SelectRecipient';
import { SelectTokenScreen } from './SelectToken';
import { TransactionOptionsScreen } from './TransactionOptions';
import {
  SendTokensAction,
  SendTokensActionId,
  SendTokensStep,
  UIBalance,
  UIContact,
  UIFeeType,
  UIFees,
  UIForm,
  UIToken,
  UITransactionType
} from './types';

// duplicated from /lib/miden/assets to allow storybook to work
const ALEO_TOKEN_ID = 'defaultaleotokenid';

const routes: Route[] = [
  {
    name: SendTokensStep.NoBalance,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: SendTokensStep.SelectToken,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: SendTokensStep.SelectRecipient,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: SendTokensStep.ContactsList,
    animationIn: 'present',
    animationOut: 'dismiss'
  },
  {
    name: SendTokensStep.TransactionOptions,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: SendTokensStep.Review,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: SendTokensStep.Confirmation,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: SendTokensStep.AdvancedOptions,
    animationIn: 'present',
    animationOut: 'dismiss'
  },
  {
    name: SendTokensStep.FeeOptions,
    animationIn: 'present',
    animationOut: 'dismiss'
  },
  {
    name: SendTokensStep.AddTokens,
    animationIn: 'present',
    animationOut: 'dismiss'
  }
];

const tokenSchema: yup.ObjectSchema<UIToken> = yup.object({
  id: yup.string().required(),
  name: yup.string().required(),
  publicBalance: yup.number().required(),
  privateBalance: yup.number().required(),
  fiatPrice: yup.number().required()
});

const validations = {
  amount: yup.string().required(''),
  sendType: yup.string().required(),
  receiveType: yup.string().required(),
  token: tokenSchema.required(),
  recipientAddress: yup.string().min(4).required(),
  recipientAddressInput: yup.string().min(4),
  recipientAnsName: yup.string(),
  feeAmount: yup
    .string()
    .required('Fee is required')
    .test('is-greater-than-zero', 'Fee amount must be greater than 0', value => parseFloat(value) > 0),
  feeType: yup.string().required()
};

const schema = yup
  .object<UIForm>()
  .shape(validations, [['amount', 'feeAmount']])
  .test('combined-amount', 'Insufficient funds', function (this, values) {
    let { amount, feeAmount, token, sendType } = values;
    const tokenData = token as UIToken;
    let total = parseFloat(amount);
    if (token.id === ALEO_TOKEN_ID) {
      total += parseFloat(feeAmount);
    }
    const isValid =
      total <= (sendType === UITransactionType.Public ? tokenData.publicBalance : tokenData.privateBalance);
    if (!isValid) {
      return this.createError({
        path: 'amount',
        message: 'Insufficient funds'
      });
    }
    return isValid;
  })
  .required();

export interface IndexScreenProps extends HTMLAttributes<HTMLDivElement> {
  aleoBalance: UIBalance;
  aleoRecordCount: number;
  aleoTokenId: string;
  accountWallet?: string;
  tokens?: UIToken[];
  contacts: UIContact[];
  recommendedFees: UIFees;
  chainId?: string;
  isLoading: boolean;
  preselectedTokenId?: string;
  resolveRecipientAddress?: (address: string) => Promise<{ ansName?: string; address: string }>;
  onClose?: () => void;
  onNavigateTo?: (url: 'buy-tokens' | 'transfer-tokens' | 'faucet') => void;
  onSubmitForm?: (data: UIForm) => Promise<boolean>;
}

const IndexScreen: React.FC<IndexScreenProps> = ({
  className,
  tokens,
  contacts,
  aleoBalance,
  aleoRecordCount,
  aleoTokenId,
  accountWallet,
  recommendedFees,
  isLoading,
  chainId,
  preselectedTokenId,
  resolveRecipientAddress,
  onClose,
  onSubmitForm,
  onNavigateTo,
  ...props
}) => {
  const { navigateTo, goBack, activeRoute } = useNavigator();
  const [shouldDisplayTransactionType, setShouldDisplayTransactionType] = useState(false);

  const totalAleoBalance = useMemo(() => aleoBalance.private + aleoBalance.public, [aleoBalance]);

  const initialRoute = useMemo(() => {
    if (totalAleoBalance === 0) {
      return routes[0];
    }
    if (preselectedTokenId) {
      return routes[2];
    }
    return routes[1];
  }, [totalAleoBalance, preselectedTokenId]);

  const { register, handleSubmit, setValue, errors, watch, triggerValidation, formState, setError, clearError } =
    useForm<UIForm>({
      defaultValues: {
        amount: undefined,
        sendType: UITransactionType.Public,
        receiveType: UITransactionType.Public,
        token: preselectedTokenId
          ? tokens?.find(token => token.id.toLowerCase() === preselectedTokenId.toLowerCase())
          : undefined,
        recipientAddress: undefined,
        recipientAddressInput: undefined,
        recipientAnsName: undefined,
        feeAmount: recommendedFees.ALEO[UITransactionType.Public][UITransactionType.Public],
        feeType: UIFeeType.Public,
        delegateTransaction: true
      },
      validationSchema: schema,
      validationContext: {
        chainId
      }
    });

  useEffect(() => {
    register('token');
    register('amount');
    register('sendType');
    register('receiveType');
    register('recipientAddress');
    register('recipientAddressInput');
    register('recipientAnsName');
    register('feeAmount');
    register('feeType');
    register('delegateTransaction');
    register('combined-amount');
  }, [register]);

  const token = watch('token');
  const recipientAddress = watch('recipientAddress');
  const recipientAddressInput = watch('recipientAddressInput');
  const recipientAnsName = watch('recipientAnsName');
  const amount = watch('amount');
  const sendType = watch('sendType');
  const receiveType = watch('receiveType');
  const feeAmount = watch('feeAmount');
  const feeType = watch('feeType');
  const delegateTransaction = watch('delegateTransaction');

  const recommendedFee = useMemo(() => {
    if (!token) {
      return recommendedFees.ALEO[UITransactionType.Public][UITransactionType.Public];
    }

    const recommendedFeeSet = token.id === aleoTokenId ? recommendedFees.ALEO : recommendedFees.OTHER;
    return recommendedFeeSet[sendType][receiveType];
  }, [recommendedFees, sendType, receiveType, token, aleoTokenId]);

  useEffect(() => {
    setValue('feeAmount', recommendedFee);
  }, [recommendedFee, setValue]);

  // tokens is not guaranteed to be loaded on initial render
  useEffect(() => {
    const newToken = preselectedTokenId
      ? tokens?.find(token => token.id.toLowerCase() === preselectedTokenId.toLowerCase())
      : undefined;
    setValue('token', newToken);
  }, [tokens, preselectedTokenId, setValue]);

  useEffect(() => {
    const validate = async () => {
      try {
        if (!recipientAddressInput || recipientAddressInput.length < 4) {
          clearError('recipientAddress');
          return;
        }

        const resolvedAddress = await resolveRecipientAddress?.(recipientAddressInput);
        if (!resolvedAddress?.address) {
          setError('recipientAddress', 'manual', 'Invalid ALEO address');
        } else {
          setValue('recipientAddress', resolvedAddress.address);
          setValue('recipientAnsName', resolvedAddress.ansName);
          clearError('recipientAddress');
        }
      } catch {
        setError('recipientAddress', 'manual', 'Invalid ALEO address');
      }
    };
    validate();
  }, [recipientAddressInput, setValue, setError, resolveRecipientAddress, clearError]);

  useEffect(() => {
    let sendType = UITransactionType.Public;
    let receiveType = UITransactionType.Public;
    let feeType = UIFeeType.Public;

    // todo: pick max balance
    if (token && token.privateBalance > token.publicBalance) {
      sendType = UITransactionType.Private;
      receiveType = UITransactionType.Private;
      feeType = UIFeeType.Private;
    } else if (aleoBalance.private > aleoBalance.public) {
      sendType = UITransactionType.Private;
      receiveType = UITransactionType.Private;
      feeType = UIFeeType.Private;
    }

    setValue('sendType', sendType);
    setValue('receiveType', receiveType);
    setValue('feeType', feeType);
  }, [token, aleoBalance, setValue]);

  const onAction = useCallback(
    (action: SendTokensAction) => {
      switch (action.id) {
        case SendTokensActionId.Navigate:
          navigateTo(action.step);
          if (action.step === SendTokensStep.AdvancedOptions) {
            setTimeout(() => setShouldDisplayTransactionType(true), 300);
          }
          break;

        case SendTokensActionId.GoBack:
          goBack();
          break;

        case SendTokensActionId.OpenUrl:
          onNavigateTo?.(action.url);
          break;
        case SendTokensActionId.SetFormValues:
          Object.entries(action.payload).forEach(([key, value]) => {
            setValue(key, value);
          });
          if (action.triggerValidation) {
            triggerValidation();
          }
          break;
        case SendTokensActionId.Finish:
          onClose?.();
          break;

        default:
          break;
      }
    },
    [onNavigateTo, onClose, setValue, triggerValidation, navigateTo, goBack]
  );

  const onSubmit = useCallback<OnSubmit<UIForm>>(
    async (data, event) => {
      if (formState.isSubmitting) {
        return;
      }
      try {
        clearError('submit');
        await onSubmitForm?.(data);
        onAction({ id: SendTokensActionId.Navigate, step: SendTokensStep.Confirmation });
      } catch (e: any) {
        if (e.message) {
          setError('submit', 'manual', e.message);
        }
        console.error(e);
      }
    },
    [formState, onAction, onSubmitForm, clearError, setError]
  );

  useEffect(() => {
    if (activeRoute?.name === SendTokensStep.Review) {
      triggerValidation();
    }
  }, [activeRoute, triggerValidation]);

  const firstError = useMemo(() => {
    const errorEntries = Object.entries(errors);
    if (errorEntries.length > 0) {
      return (errorEntries[0][1] as FieldError).message?.toString();
    }
    return undefined;
  }, [errors]);

  const renderStep = useCallback(
    (route: Route) => {
      switch (route.name) {
        case SendTokensStep.NoBalance:
          return <NoBalanceScreen onAction={onAction} />;
        case SendTokensStep.SelectToken:
          return <SelectTokenScreen onAction={onAction} tokens={tokens} />;
        case SendTokensStep.SelectRecipient:
          return (
            <SelectRecipientScreen
              aleoBalance={aleoBalance}
              aleoRecordCount={aleoRecordCount}
              token={token!} // token should be defined at this point
              aleoTokenId={aleoTokenId}
              address={recipientAddressInput}
              canGoBack={preselectedTokenId === undefined}
              onAction={onAction}
              isLoading={isLoading}
              error={errors.recipientAddress?.message?.toString()}
              isValid={
                errors.recipientAddress === undefined && validations.recipientAddress.isValidSync(recipientAddress)
              }
            />
          );
        case SendTokensStep.ContactsList:
          return <ContactsListScreen onAction={onAction} recipientAddress={recipientAddress} contacts={contacts} />;
        case SendTokensStep.TransactionOptions:
          return (
            <TransactionOptionsScreen
              onAction={onAction}
              aleoTokenId={aleoTokenId}
              amount={amount}
              feeAmount={feeAmount}
              token={token!} // token should be defined at this point
              sendType={sendType}
              receiveType={receiveType}
              shouldDisplayTransactionType={shouldDisplayTransactionType}
              error={errors.amount?.type === 'optionality' ? undefined : errors.amount?.message?.toString()}
              isValid={validations.amount.isValidSync(amount) && !errors.amount}
            />
          );
        case SendTokensStep.Review:
          return (
            <ReviewScreen
              amount={amount}
              token={token!}
              sendType={sendType}
              receiveType={receiveType}
              feeType={feeType}
              ansName={recipientAnsName}
              recipientAddress={recipientAddress || ''}
              feeAmount={feeAmount}
              sendAddress={accountWallet || ''}
              delegateTransaction={delegateTransaction}
              isLoading={isLoading || formState.isSubmitting}
              isValid={errors.amount?.message === undefined}
              error={firstError}
              onAction={onAction}
            />
          );
        case SendTokensStep.Confirmation:
          return <ConfirmationScreen onAction={onAction} />;
        case SendTokensStep.AdvancedOptions:
          return (
            <AdvancedOptionsScreen token={token!} sendType={sendType} receiveType={receiveType} onAction={onAction} />
          );
        case SendTokensStep.FeeOptions:
          return (
            <FeeOptionsScreen
              fee={feeAmount}
              feeType={feeType}
              token={token!}
              recommendedFees={recommendedFees}
              sendType={sendType}
              receiveType={receiveType}
              aleoBalance={aleoBalance}
              aleoTokenId={aleoTokenId}
              onAction={onAction}
              error={errors.feeAmount?.message?.toString() || errors.amount?.message?.toString()}
            />
          );
        case SendTokensStep.AddTokens:
          return <AddTokensScreen onAction={onAction} />;
        default:
          return null;
      }
    },
    [
      onAction,
      formState,
      tokens,
      sendType,
      receiveType,
      aleoRecordCount,
      aleoBalance,
      recommendedFees,
      token,
      feeType,
      feeAmount,
      recipientAddress,
      contacts,
      amount,
      accountWallet,
      isLoading,
      errors,
      delegateTransaction,
      shouldDisplayTransactionType,
      preselectedTokenId,
      recipientAddressInput,
      recipientAnsName,
      firstError,
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
        <Navigator renderRoute={renderStep} initialRouteName={initialRoute.name} />
      </form>
    </div>
  );
};

const NavigatorWrapper: React.FC<IndexScreenProps> = props => {
  return (
    <NavigatorProvider routes={routes}>
      <IndexScreen {...props} />
    </NavigatorProvider>
  );
};

export { NavigatorWrapper as IndexScreen };
