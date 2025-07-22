import { UIForm } from 'screens/send-tokens/types';

export enum SendFlowStep {
  SelectRecipient = 'SelectRecipient',
  AccountsList = 'AccountsList',
  SelectAmount = 'SelectAmount',
  ReviewTransaction = 'ReviewTransaction',
  GeneratingTransaction = 'GeneratingTransaction',
  TransactionInitiated = 'TransactionInitiated'
}

export type SendFlowForm = {
  amount: string;
  sharePrivately: boolean;
  recipientAddress: string;
  recallBlocks?: string;
  delegateTransaction: boolean;
};

export enum SendFlowActionId {
  GoBack = 'go-back',
  Navigate = 'navigate',
  SetFormValues = 'set-form-values',
  GenerateTransaction = 'generate-transaction',
  Finish = 'finish'
}

export type Navigate = {
  id: SendFlowActionId.Navigate;
  step: SendFlowStep;
};

export type GoBack = {
  id: SendFlowActionId.GoBack;
};

export type SetFormValues = {
  id: SendFlowActionId.SetFormValues;
  payload: Partial<UIForm>;
  triggerValidation?: boolean;
};

export type Finish = {
  id: SendFlowActionId.Finish;
};

export type GenerateTransaction = {
  id: SendFlowActionId.GenerateTransaction;
};

export type SendFlowAction = Navigate | GoBack | SetFormValues | Finish | GenerateTransaction;

export type Contact = {
  id: string;
  name: string;
  isOwned: boolean;
};
