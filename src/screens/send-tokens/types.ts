export enum SendTokensStep {
  AdvancedOptions = 'AdvancedOptions',
  SelectRecipient = 'SelectRecipient',
  SelectToken = 'SelectToken',
  Confirmation = 'Confirmation',
  ContactsList = 'ContactsList',
  FeeOptions = 'FeeOptions',
  NoBalance = 'NoBalance',
  Review = 'Review',
  TransactionOptions = 'TransactionOptions',
  AddTokens = 'AddTokens'
}

export enum SendTokensActionId {
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
  id: SendTokensActionId.Navigate;
  step: SendTokensStep;
};

export type OpenUrlAction = {
  id: SendTokensActionId.OpenUrl;
  url: 'buy-tokens' | 'transfer-tokens' | 'faucet';
};

export type GoBackAction = {
  id: SendTokensActionId.GoBack;
};

export type SetFormValuesAction = {
  id: SendTokensActionId.SetFormValues;
  payload: Partial<UIForm>;
  triggerValidation?: boolean;
};

export type FinishAction = {
  id: SendTokensActionId.Finish;
};

export type SendTokensAction = NavigateAction | GoBackAction | OpenUrlAction | SetFormValuesAction | FinishAction;

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
  sharePrivately: boolean;
  receiveType: UITransactionType;
  recallBlocks?: string;
  recipientAddress?: string;
  recipientAddressInput?: string;
  recipientAnsName?: string;
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
  ALEO: {
    [UITransactionType.Public]: {
      [UITransactionType.Public]: string;
      [UITransactionType.Private]: string;
    };
    [UITransactionType.Private]: {
      [UITransactionType.Public]: string;
      [UITransactionType.Private]: string;
    };
  };
  OTHER: {
    [UITransactionType.Public]: {
      [UITransactionType.Public]: string;
      [UITransactionType.Private]: string;
    };
    [UITransactionType.Private]: {
      [UITransactionType.Public]: string;
      [UITransactionType.Private]: string;
    };
  };
};
