export enum OnboardingType {
  Create = 'create',
  Import = 'import'
}

export enum OnboardingStep {
  Welcome = 'welcome',
  BackupWallet = 'backup-wallet',
  VerifySeedPhrase = 'verify-seed-phrase',
  ImportWallet = 'import-wallet',
  CreatePassword = 'create-password',
  SelectTransactionType = 'select-transaction-type',
  Confirmation = 'confirmation'
}

export type OnboardingActionId =
  | 'create-wallet'
  | 'import-wallet'
  | 'verify-seed-phrase'
  | 'create-password'
  | 'create-password-submit'
  | 'select-transaction-type'
  | 'confirmation';

export type CreateWalletAction = {
  id: 'create-wallet';
};

export type ImportWalletAction = {
  id: 'import-wallet';
};

export type VerifySeedPhraseAction = {
  id: 'verify-seed-phrase';
};

export type CreatePasswordAction = {
  id: 'create-password';
};

export type CreatePasswordSubmitAction = {
  id: 'create-password-submit';
  payload: string;
};

export type SelectTransactionTypeAction = {
  id: 'select-transaction-type';
  payload: string;
};

export type ConfirmationAction = {
  id: 'confirmation';
};

export type ImportSeedPhraseSubmitAction = {
  id: 'import-seed-phrase-submit';
  payload: string;
};

export type BackAction = {
  id: 'back';
};

export type OnboardingAction =
  | CreateWalletAction
  | ImportWalletAction
  | VerifySeedPhraseAction
  | CreatePasswordAction
  | CreatePasswordSubmitAction
  | SelectTransactionTypeAction
  | ConfirmationAction
  | ImportSeedPhraseSubmitAction
  | BackAction;

// TODO: Potentially make this into what the onboarding flows use to render the
// steps rather than hardcode the path in onboarding flow
export type OnboardingPlan = {
  steps: OnboardingStep[]; // Order maintained
};
