import React, { useEffect, useCallback, ChangeEvent } from 'react';

import { NoteType } from '@demox-labs/miden-sdk';
import classNames from 'clsx';
import { OnSubmit, useForm } from 'react-hook-form';

import { Route, Navigator, NavigatorProvider, useNavigator } from 'components/Navigator';
import { SendFlowAction, SendFlowActionId, SendFlowForm, SendFlowStep } from 'screens/send-tokens/types';

import { ReviewTransaction } from './ReviewTransaction';
import { SelectAmount } from './SelectAmount';
import { SelectRecipient } from './SelectRecipient';
import { navigate } from 'lib/woozie';

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
    name: SendFlowStep.TransactionInitiated,
    animationIn: 'push',
    animationOut: 'pop'
  }
];

export interface SendManagerProps {
  isLoading: boolean;
  onSubmitForm?: (data: SendFlowForm) => Promise<boolean>;
}

export const SendManager: React.FC<SendManagerProps> = ({ isLoading, onSubmitForm }) => {
  const { navigateTo, goBack } = useNavigator();

  const onClose = useCallback(() => {
    navigate('/');
  }, []);

  const { register, watch, handleSubmit, formState, setError, clearError } = useForm<SendFlowForm>({
    defaultValues: {
      amount: undefined,
      sendType: NoteType.public(),
      receiveType: NoteType.public(),
      recipientAddress: undefined,
      recipientAddressInput: undefined
    }
  });

  useEffect(() => {
    register('amount');
    register('sendType');
    register('receiveType');
    register('recipientAddress');
    register('recipientAddressInput');
  }, [register]);

  const amount = watch('amount');
  const sendType = watch('sendType');
  const receiveType = watch('receiveType');
  const recipientAddress = watch('recipientAddress');
  const recipientAddressInput = watch('recipientAddressInput');

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
        default:
          break;
      }
    },
    [navigateTo, goBack, onClose]
  );

  const onSubmit = useCallback<OnSubmit<SendFlowForm>>(
    async (data, event) => {
      if (formState.isSubmitting) {
        return;
      }
      try {
        clearError('submit');
        await onSubmitForm?.(data);
        onAction({ id: SendFlowActionId.Navigate, step: SendFlowStep.ReviewTransaction });
      } catch (e: any) {
        if (e.message) {
          setError('submit', 'manual', e.message);
        }
        console.error(e);
      }
    },
    [formState, onAction, onSubmitForm, clearError, setError]
  );

  const onAddressChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onAction({
        id: SendFlowActionId.SetFormValues,
        payload: { recipientAddressInput: event.target.value }
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
      payload: { recipientAddressInput: '' }
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
            />
          );
        case SendFlowStep.ReviewTransaction:
          return <ReviewTransaction onGoBack={goBack} amount={amount} recipientAddress={recipientAddress} />;
        case SendFlowStep.TransactionInitiated:
          return <></>;
        default:
          return <></>;
      }
    },
    [amount, goBack, goToStep, onAddressChange, onClearAddress, recipientAddress]
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
