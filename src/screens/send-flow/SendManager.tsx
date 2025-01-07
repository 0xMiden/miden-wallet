import React, { ChangeEvent, useCallback, useEffect } from 'react';

import classNames from 'clsx';
import { OnSubmit, useForm } from 'react-hook-form';

import { openLoadingFullPage, useAppEnv } from 'app/env';
import { isDelegateProofEnabled } from 'app/templates/DelegateSettings';
import { getFaucetIdSetting } from 'app/templates/EditMidenFaucetId';
import { Navigator, NavigatorProvider, Route, useNavigator } from 'components/Navigator';
import { MidenTokens, TOKEN_MAPPING } from 'lib/miden-chain/constants';
import { useAccount } from 'lib/miden/front';
import { useQueuedTransactions } from 'lib/miden/front/queued-transactions';
import { NoteTypeEnum, QueuedTransactionType, SendTransactionTransaction } from 'lib/miden/types';
import { navigate } from 'lib/woozie';
import { SendFlowAction, SendFlowActionId, SendFlowForm, SendFlowStep } from 'screens/send-tokens/types';

import { ReviewTransaction } from './ReviewTransaction';
import { SelectAmount } from './SelectAmount';
import { SelectRecipient } from './SelectRecipient';
import { TransactionInitiated } from './TransactionInitiated';

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
  const [, queueTransaction] = useQueuedTransactions();
  const isDelegatedProvingEnabled = isDelegateProofEnabled();
  const faucetId = getFaucetIdSetting();
  const { fullPage } = useAppEnv();

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

  const { register, watch, handleSubmit, formState, setError, clearError, setValue } = useForm<SendFlowForm>({
    defaultValues: {
      amount: undefined,
      sharePrivately: false,
      recipientAddress: undefined,
      recallBlocks: undefined
    }
  });

  useEffect(() => {
    register('amount');
    register('sharePrivately');
    register('recipientAddress');
    register('recallBlocks');
  }, [register]);

  const amount = watch('amount');
  const sharePrivately = watch('sharePrivately');
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
        case SendFlowActionId.GenerateTransaction:
          onGenerateTransaction();
          break;
        default:
          break;
      }
    },
    [navigateTo, goBack, onClose, setValue, onGenerateTransaction]
  );

  const onSubmit = useCallback<OnSubmit<SendFlowForm>>(
    async (data, event) => {
      if (formState.isSubmitting) {
        return;
      }
      try {
        clearError('submit');
        const payload: SendTransactionTransaction = {
          senderAccountId: publicKey!,
          recipientAccountId: recipientAddress!,
          faucetId: faucetId, // TODO: add more robust way to change faucet id
          noteType: sharePrivately ? NoteTypeEnum.Private : NoteTypeEnum.Public,
          amount: amount!,
          recallBlocks: recallBlocks ? parseInt(recallBlocks) : undefined,
          delegateTransaction: isDelegatedProvingEnabled
        };
        const transaction = { type: QueuedTransactionType.SendTransaction, data: payload };
        queueTransaction(transaction);
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
      amount,
      recallBlocks,
      queueTransaction,
      setError,
      isDelegatedProvingEnabled,
      faucetId
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
              sharePrivately={sharePrivately}
            />
          );
        case SendFlowStep.TransactionInitiated:
          return <TransactionInitiated onAction={onAction} />;
        default:
          return <></>;
      }
    },
    [amount, goBack, goToStep, onAction, onAddressChange, onClearAddress, onClose, recipientAddress, sharePrivately]
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
