export enum OnboardingType {
  Create = 'create',
  Import = 'import'
}

export enum WalletType {
  OffChain = 'off-chain',
  OnChain = 'on-chain'
}

export enum OnboardingStep {
  Welcome = 'welcome',
  BackupSeedPhrase = 'backup-seed-phrase',
  VerifySeedPhrase = 'verify-seed-phrase',
  ImportWallet = 'import-wallet',
  CreatePassword = 'create-password',
  SelectTransactionType = 'select-transaction-type',
  Confirmation = 'confirmation'
}

export type OnboardingActionId =
  | 'create-wallet'
  | 'import-wallet'
  | 'backup-seed-phrase'
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

export type BackupSeedPhraseAction = {
  id: 'backup-seed-phrase';
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

export type ImportWalletFileSubmitAction = {
  id: 'import-wallet-file-submit';
  payload: Uint8Array;
};

export type BackAction = {
  id: 'back';
};

export type OnboardingAction =
  | CreateWalletAction
  | BackupSeedPhraseAction
  | ImportWalletAction
  | VerifySeedPhraseAction
  | CreatePasswordAction
  | CreatePasswordSubmitAction
  | SelectTransactionTypeAction
  | ConfirmationAction
  | ImportWalletFileSubmitAction
  | BackAction;

// TODO: Potentially make this into what the onboarding flows use to render the
// steps rather than hardcode the path in onboarding flow
export type OnboardingPlan = {
  steps: OnboardingStep[]; // Order maintained
};
