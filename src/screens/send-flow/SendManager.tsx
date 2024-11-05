import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';
import { OnSubmit, useForm } from 'react-hook-form';

import { Navigator, NavigatorProvider, Route, useNavigator } from 'components/Navigator';
import { MidenTokens, TOKEN_MAPPING } from 'lib/miden-chain/constants';
import { useAccount } from 'lib/miden/front';
import { useQueuedTransactions } from 'lib/miden/front/queued-transactions';
import { QueuedTransactionType, SendTransactionTransaction } from 'lib/miden/types';
import { navigate } from 'lib/woozie';
import { UITransactionType } from 'screens/convert-tokens/types';
import { SendFlowAction, SendFlowActionId, SendFlowForm, SendFlowStep } from 'screens/send-tokens/types';

import { GeneratingTransaction } from './GeneratingTransaction';
import { ReviewTransaction } from './ReviewTransaction';
import { SelectAmount } from './SelectAmount';
import { SelectRecipient } from './SelectRecipient';
import { TransactionInitiated } from './TransactionInitiated';
import { isDelegateProofEnabled } from 'app/templates/DelegateSettings';

const ROUTES: Route[] = [
  {
    name: SendFlowStep.SelectRecipient,
    animationIn: 'push',
    animationOut: 'pop'
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

export interface SendManagerProps {
  isLoading: boolean;
}

export const SendManager: React.FC<SendManagerProps> = ({ isLoading }) => {
  const { navigateTo, goBack } = useNavigator();
  const { publicKey } = useAccount();
  const [transactionGenerationComplete, setTransactionGenerationComplete] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [, queueTransaction] = useQueuedTransactions();
  const isDelegatedProvingEnabled = isDelegateProofEnabled();

  const onClose = useCallback(() => {
    navigate('/');
  }, []);

  const { register, watch, handleSubmit, formState, setError, clearError, setValue } = useForm<SendFlowForm>({
    defaultValues: {
      amount: undefined,
      sendType: UITransactionType.Public,
      recipientAddress: undefined,
      recallBlocks: undefined
    }
  });

  useEffect(() => {
    register('amount');
    register('sendType');
    register('recipientAddress');
    register('recallBlocks');
  }, [register]);

  const amount = watch('amount');
  const sendType = watch('sendType');
  const recipientAddress = watch('recipientAddress');
  const recallBlocks = watch('recallBlocks');

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
          break;
        default:
          break;
      }
    },
    [navigateTo, goBack, onClose, setValue]
  );

  const onSubmit = useCallback<OnSubmit<SendFlowForm>>(
    async (data, event) => {
      if (formState.isSubmitting) {
        return;
      }
      try {
        clearError('submit');
        console.log(data);
        onAction({ id: SendFlowActionId.Navigate, step: SendFlowStep.TransactionInitiated });
        const payload: SendTransactionTransaction = {
          senderAccountId: publicKey!,
          recipientAccountId: recipientAddress!,
          faucetId: TOKEN_MAPPING[MidenTokens.Miden].faucetId, // TODO: add more robust way to change faucet id
          noteType: sendType,
          amount: amount!,
          recallBlocks: recallBlocks ? parseInt(recallBlocks) : undefined,
          delegateTransaction: isDelegatedProvingEnabled
        };
        const transaction = { type: QueuedTransactionType.SendTransaction, data: payload };
        queueTransaction(transaction);
      } catch (e: any) {
        if (e.message) {
          setError('submit', 'manual', e.message);
        }
        setSubmitError(true);
        console.error(e);
      }
    },
    [
      formState.isSubmitting,
      clearError,
      onAction,
      publicKey,
      recipientAddress,
      sendType,
      amount,
      recallBlocks,
      queueTransaction,
      setError,
      isDelegatedProvingEnabled
    ]
  );

  const onAddressChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onAction({
        id: SendFlowActionId.SetFormValues,
        payload: { recipientAddress: event.target.value }
      });
    },
    [onAction]
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
        case SendFlowStep.SelectRecipient:
          return (
            <SelectRecipient
              onGoBack={goBack}
              address={recipientAddress}
              onAddressChange={onAddressChange}
              onGoNext={() => goToStep(SendFlowStep.SelectAmount)}
              onClear={onClearAddress}
              onClose={onClose}
              onCancel={onClose}
            />
          );
        case SendFlowStep.SelectAmount:
          return (
            <SelectAmount
              onGoBack={goBack}
              onGoNext={() => goToStep(SendFlowStep.ReviewTransaction)}
              amount={amount}
              onCancel={onClose}
              onAction={onAction}
            />
          );
        case SendFlowStep.ReviewTransaction:
          return (
            <ReviewTransaction
              onAction={onAction}
              onGoBack={goBack}
              amount={amount}
              recipientAddress={recipientAddress}
              sendType={JSON.stringify(sendType)}
            />
          );
        case SendFlowStep.GeneratingTransaction:
          return (
            <GeneratingTransaction
              transactionComplete={transactionGenerationComplete}
              onAction={onAction}
              submitError={submitError}
            />
          );
        case SendFlowStep.TransactionInitiated:
          return <TransactionInitiated onAction={onAction} />;
        default:
          return <></>;
      }
    },
    [
      amount,
      goBack,
      goToStep,
      onAction,
      onAddressChange,
      onClearAddress,
      onClose,
      recipientAddress,
      sendType,
      transactionGenerationComplete,
      submitError
    ]
  );

  return (
    <div
      className={classNames(
        'w-[22.5rem] h-[37.5rem] md:w-[37.5rem] md:h-[46.875rem] md:my-8',
        'mx-auto border rounded-md overflow-hidden ',
        'flex flex-1',
        'flex-col bg-white',
        'rounded-3xl',
        'overflow-hidden relative'
      )}
      data-testid="send-flow"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex">
        <Navigator renderRoute={renderStep} initialRouteName={SendFlowStep.SelectRecipient} />
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
