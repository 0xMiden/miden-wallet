import React, { ChangeEvent, useCallback, useEffect, useMemo } from 'react';

import classNames from 'clsx';
import { OnSubmit, useForm } from 'react-hook-form';
import * as yup from 'yup';

import { openLoadingFullPage, useAppEnv } from 'app/env';
import { isDelegateProofEnabled } from 'app/templates/DelegateSettings';
import { Navigator, NavigatorProvider, Route, useNavigator } from 'components/Navigator';
import { stringToBigInt } from 'lib/i18n/numbers';
import { initiateSendTransaction } from 'lib/miden/activity';
import {
  getFaucetIdSetting,
  isMidenFaucet,
  MIDEN_METADATA,
  useAccount,
  useAllAccounts,
  useFungibleTokens
} from 'lib/miden/front';
import { NoteTypeEnum } from 'lib/miden/types';
import { navigate } from 'lib/woozie';
import { isValidMidenAddress } from 'utils/miden';
import { shortenAddress } from 'utils/string';

import { AccountsList } from './AccountsList';
import { ReviewTransaction } from './ReviewTransaction';
import { SelectAmount } from './SelectAmount';
import { SelectRecipient } from './SelectRecipient';
import { SelectToken } from './SelectToken';
import { TransactionInitiated } from './TransactionInitiated';
import { Contact, SendFlowAction, SendFlowActionId, SendFlowForm, SendFlowStep } from './types';

const ROUTES: Route[] = [
  {
    name: SendFlowStep.SelectToken,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: SendFlowStep.SelectRecipient,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: SendFlowStep.AccountsList,
    animationIn: 'present',
    animationOut: 'dismiss'
  },
  {
    name: SendFlowStep.SelectAmount,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: SendFlowStep.ReviewTransaction,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: SendFlowStep.GeneratingTransaction,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: SendFlowStep.TransactionInitiated,
    animationIn: 'push',
    animationOut: 'pop'
  }
];

const validations = {
  amount: yup
    .string()
    .required()
    .test('is-greater-than-zero', 'Amount must be greater than 0', value => {
      return parseFloat(value) > 0;
    }),
  sharePrivately: yup.boolean().required(),
  recipientAddress: yup
    .string()
    .required()
    .test('is-valid-address', 'Invalid address', value => isValidMidenAddress(value)),
  recallBlocks: yup.number(),
  delegateTransaction: yup.boolean().required()
};

const validationSchema = yup.object<SendFlowForm>().shape(validations).required();

export interface SendManagerProps {
  isLoading: boolean;
}

export const SendManager: React.FC<SendManagerProps> = ({ isLoading }) => {
  const { navigateTo, goBack } = useNavigator();
  const allAccounts = useAllAccounts();
  const { publicKey } = useAccount();
  const { fullPage } = useAppEnv();
  const delegateEnabled = isDelegateProofEnabled();
  const { data: balanceData } = useFungibleTokens(publicKey);
  const tokens = useMemo(() => {
    return (
      balanceData?.tokens.map(token => ({
        id: token.faucetId,
        name: isMidenFaucet(token.faucetId) ? 'MIDEN' : shortenAddress(token.faucetId, 7, 4),
        balance: token.balance.toNumber(),
        fiatPrice: 1
      })) || []
    );
  }, [balanceData]);

  const otherAccounts: Contact[] = useMemo(
    () =>
      allAccounts
        .filter(c => c.publicKey !== publicKey)
        .map(
          contact =>
            ({
              id: contact.publicKey,
              name: contact.name,
              isOwned: true
            } as Contact)
        ),
    [allAccounts, publicKey]
  );

  const onClose = useCallback(() => {
    navigate('/');
  }, []);

  const onGenerateTransaction = useCallback(() => {
    if (fullPage) {
      navigate('/generating-transaction-full');
      return;
    }

    openLoadingFullPage();
    navigateTo(SendFlowStep.TransactionInitiated);
  }, [fullPage, navigateTo]);

  const { register, watch, handleSubmit, formState, setError, clearError, errors, setValue, triggerValidation } =
    useForm<SendFlowForm>({
      defaultValues: {
        amount: undefined,
        sharePrivately: false,
        recipientAddress: undefined,
        recallBlocks: undefined,
        delegateTransaction: delegateEnabled,
        token: undefined
      },
      validationSchema
    });

  useEffect(() => {
    register('amount');
    register('sharePrivately');
    register('recipientAddress');
    register('recallBlocks');
    register('delegateTransaction');
    register('token');
  }, [register]);

  const amount = watch('amount');
  const sharePrivately = watch('sharePrivately');
  const recipientAddress = watch('recipientAddress');
  const recallBlocks = watch('recallBlocks');
  const delegateTransaction = watch('delegateTransaction');
  const token = watch('token');

  const onAction = useCallback(
    (action: SendFlowAction) => {
      switch (action.id) {
        case SendFlowActionId.Navigate:
          navigateTo(action.step);
          break;
        case SendFlowActionId.GoBack:
          goBack();
          break;
        case SendFlowActionId.Finish:
          onClose?.();
          break;
        case SendFlowActionId.SetFormValues:
          Object.entries(action.payload).forEach(([key, value]) => {
            setValue(key, value);
          });
          if (action.triggerValidation) {
            triggerValidation();
          }
          break;
        case SendFlowActionId.GenerateTransaction:
          onGenerateTransaction();
          break;
        default:
          break;
      }
    },
    [navigateTo, goBack, onClose, onGenerateTransaction, setValue, triggerValidation]
  );

  const onSubmit = useCallback<OnSubmit<SendFlowForm>>(
    async (data, event) => {
      if (formState.isSubmitting) {
        return;
      }
      try {
        clearError('submit');
        await initiateSendTransaction(
          publicKey!,
          recipientAddress!,
          token!.id,
          sharePrivately ? NoteTypeEnum.Private : NoteTypeEnum.Public,
          stringToBigInt(amount!, MIDEN_METADATA.decimals),
          recallBlocks ? parseInt(recallBlocks) : undefined,
          delegateTransaction
        );
        onAction({ id: SendFlowActionId.GenerateTransaction });
      } catch (e: any) {
        if (e.message) {
          setError('submit', 'manual', e.message);
        }
        console.error(e);
      }
    },
    [
      formState.isSubmitting,
      clearError,
      onAction,
      publicKey,
      recipientAddress,
      sharePrivately,
      delegateTransaction,
      amount,
      recallBlocks,
      setError,
      token
    ]
  );

  const onAddressChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const address = event.target.value;
      onAction({
        id: SendFlowActionId.SetFormValues,
        payload: { recipientAddress: address }
      });
      if (!isValidMidenAddress(address)) {
        setError('recipientAddress', 'manual', 'invalidMidenAccountId');
      } else {
        clearError('recipientAddress');
      }
    },
    [onAction, setError, clearError]
  );

  const onSelectContact = useCallback(
    (contact: Contact) => {
      onAction({
        id: SendFlowActionId.SetFormValues,
        payload: { recipientAddress: contact.id }
      });
      setTimeout(() => goBack(), 300);
    },
    [onAction, goBack]
  );

  const onAmountChange = useCallback(
    (amountString: string | undefined) => {
      onAction({
        id: SendFlowActionId.SetFormValues,
        payload: { amount: amountString }
      });

      const amount = parseFloat(amountString || '0');
      if (!validations.amount.isValidSync(amountString)) {
        setError('amount', 'manual', 'Invalid amount');
      } else if (amount > token!.balance) {
        setError('amount', 'manual', 'amountMustBeLessThanBalance');
      } else {
        clearError('amount');
      }
    },
    [onAction, token, setError, clearError]
  );

  const goToStep = useCallback(
    (step: SendFlowStep) => {
      onAction({ id: SendFlowActionId.Navigate, step });
    },
    [onAction]
  );

  const onClearAddress = useCallback(() => {
    onAction({
      id: SendFlowActionId.SetFormValues,
      payload: { recipientAddress: '' }
    });
  }, [onAction]);

  const renderStep = useCallback(
    (route: Route) => {
      switch (route.name) {
        case SendFlowStep.SelectToken:
          return <SelectToken onAction={onAction} tokens={tokens} />;
        case SendFlowStep.SelectRecipient:
          return (
            <SelectRecipient
              address={recipientAddress}
              isValidAddress={!errors.recipientAddress && validations.recipientAddress.isValidSync(recipientAddress)}
              error={errors.recipientAddress?.message?.toString()}
              onAddressChange={onAddressChange}
              onYourAccounts={() => goToStep(SendFlowStep.AccountsList)}
              onGoNext={() => goToStep(SendFlowStep.SelectAmount)}
              onClear={onClearAddress}
              onClose={onClose}
              onCancel={onClose}
            />
          );
        case SendFlowStep.AccountsList:
          return (
            <AccountsList
              recipientAccountId={recipientAddress}
              accounts={otherAccounts}
              onClose={goBack}
              onSelectContact={onSelectContact}
            />
          );
        case SendFlowStep.SelectAmount:
          return (
            <SelectAmount
              amount={amount}
              isValidAmount={!errors.amount && validations.amount.isValidSync(amount)}
              error={errors.amount?.message?.toString()}
              token={token!}
              onGoBack={goBack}
              onGoNext={() => goToStep(SendFlowStep.ReviewTransaction)}
              onCancel={onClose}
              onAmountChange={onAmountChange}
            />
          );
        case SendFlowStep.ReviewTransaction:
          return (
            <ReviewTransaction
              onAction={onAction}
              onGoBack={goBack}
              amount={amount}
              recipientAddress={recipientAddress}
              sharePrivately={sharePrivately}
              delegateTransaction={delegateTransaction}
            />
          );
        case SendFlowStep.TransactionInitiated:
          return <TransactionInitiated onAction={onAction} />;
        default:
          return <></>;
      }
    },
    [
      token,
      tokens,
      recipientAddress,
      otherAccounts,
      errors.recipientAddress,
      errors.amount,
      onAddressChange,
      onClearAddress,
      onClose,
      goBack,
      onSelectContact,
      amount,
      onAmountChange,
      onAction,
      sharePrivately,
      delegateTransaction,
      goToStep
    ]
  );

  return (
    <div
      className={classNames(
        fullPage
          ? 'h-[640px] max-h-[640px] w-[600px] max-w-[600px]'
          : 'h-[600px] max-h-[600px] w-[340px] max-w-[340px]',
        'mx-auto overflow-hidden ',
        'flex flex-1',
        'flex-col bg-white',
        fullPage && 'border rounded-3xl',
        'overflow-hidden relative'
      )}
      data-testid="send-flow"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex">
        <Navigator renderRoute={renderStep} initialRouteName={SendFlowStep.SelectToken} />
      </form>
    </div>
  );
};

const NavigatorWrapper: React.FC<SendManagerProps> = props => {
  return (
    <NavigatorProvider routes={ROUTES}>
      <SendManager {...props} />
    </NavigatorProvider>
  );
};

export { NavigatorWrapper as SendFlow };
