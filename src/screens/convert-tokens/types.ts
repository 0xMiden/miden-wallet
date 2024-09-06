export enum ConvertTokensStep {
  Confirmation = 'Confirmation',
  Review = 'Review',
  TransactionOptions = 'TransactionOptions',
  FeeOptions = 'FeeOptions'
}

export enum ConvertTokensActionId {
  Navigate = 'navigate',
  GoBack = 'go-back',

  OpenUrl = 'open-url',

  SetFormValues = 'set-form-values',

  Finish = 'finish'
}

export enum UIFeeType {
  Public = 'public',
  Private = 'private'
}

export type NavigateAction = {
  id: ConvertTokensActionId.Navigate;
  step: ConvertTokensStep;
};

export type OpenUrlAction = {
  id: ConvertTokensActionId.OpenUrl;
  url: 'buy-tokens' | 'transfer-tokens' | 'faucet';
};

export type GoBack = {
  id: ConvertTokensActionId.GoBack;
};

export type GoBackAction = {
  id: ConvertTokensActionId.GoBack;
};

export type SetFormValuesAction = {
  id: ConvertTokensActionId.SetFormValues;
  payload: Partial<UIForm>;
  triggerValidation?: boolean;
};

export type FinishAction = {
  id: ConvertTokensActionId.Finish;
};

export type ConvertTokensAction = NavigateAction | GoBack | OpenUrlAction | SetFormValuesAction | FinishAction;

export type UIToken = {
  id: string;
  name: string;
  privateBalance: number;
  publicBalance: number;
  fiatPrice: number;
};

export type UIContact = {
  id: string;
  name: string;
  address: string;
  isOwned: boolean;
};

export enum UITransactionType {
  Public = 'public',
  Private = 'private'
}

export type UIForm = {
  amount: string;
  sendType: UITransactionType;
  receiveType: UITransactionType;
  token?: UIToken;
  feeAmount: string;
  feeType: UIFeeType;
  delegateTransaction: boolean;
};

export const TransactionTypeNameMapping: Record<UITransactionType, string> = {
  [UITransactionType.Public]: 'Public',
  [UITransactionType.Private]: 'Private'
};

export type UIBalance = {
  public: number;
  private: number;
};

export type UIRecords = {
  public: number;
  private: number;
};

export type UIFees = {
  public: string;
  private: string;
};
