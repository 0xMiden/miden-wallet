export enum EncryptedFileStep {
  WalletPassword = 'WalletPassword',
  ExportFilePassword = 'ExportFilePassword',
  ExportFileComplete = 'ExportFileComplete',
  Navigate = 'Navigate'
}

export type EncryptedFileForm = {
  walletPassword: string;
  fileName: string;
  filePassword: string;
};

export enum EncryptedFileActionId {
  GoBack = 'go-back',
  Navigate = 'navigate',
  SetFormValues = 'set-form-values',
  Finish = 'finish'
}

export type Navigate = {
  id: EncryptedFileActionId.Navigate;
  step: EncryptedFileStep;
};

export type GoBack = {
  id: EncryptedFileActionId.GoBack;
};

export type SetFormValues = {
  id: EncryptedFileActionId.SetFormValues;
  payload: Partial<UIForm>;
  triggerValidation?: boolean;
};

export type Finish = {
  id: EncryptedFileActionId.Finish;
};

export type EncryptedFileAction = Navigate | GoBack | SetFormValues | Finish;

export type UIForm = {
  walletPassword?: string;
  fileName: string;
  filePassword?: string;
};
