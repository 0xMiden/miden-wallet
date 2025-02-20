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
import { navigate } from 'lib/woozie';
import { EncryptedFileAction, EncryptedFileActionId, EncryptedFileForm, EncryptedFileStep } from './types';
import EncryptedWalletFileWalletPassword from 'screens/encrypted-file-flow/EncryptedWalletFileWalletPassword';
import ExportFileName from './ExportFileName';
import ExportFilePassword from './ExportFilePassword';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import ExportFileComplete from './ExportFileComplete';

const ROUTES: Route[] = [
  {
    name: EncryptedFileStep.WalletPassword,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: EncryptedFileStep.ExportFileName,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: EncryptedFileStep.ExportFilePassword,
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: EncryptedFileStep.ExportFileComplete,
    animationIn: 'push',
    animationOut: 'pop'
  }
];

export interface EncryptedFileManagerProps {}

export const EncryptedFileManager: React.FC<{}> = () => {
  const { navigateTo, goBack } = useNavigator();
  const { publicKey } = useAccount();
  const [, queueTransaction] = useQueuedTransactions();
  const isDelegatedProvingEnabled = isDelegateProofEnabled();
  const faucetId = getFaucetIdSetting();
  const { fullPage } = useAppEnv();

  const onClose = useCallback(() => {
    navigate('/settings');
  }, []);

  const { register, watch, handleSubmit, formState, setError, clearError, setValue } = useForm<EncryptedFileForm>({
    defaultValues: {
      walletPassword: undefined,
      filePassword: undefined,
      fileName: 'Encrypted Wallet File.json'
    }
  });

  useEffect(() => {
    register('fileName');
    register('filePassword');
  }, [register]);

  const fileName = watch('fileName');
  const filePassword = watch('filePassword');

  const onAction = useCallback(
    (action: EncryptedFileAction) => {
      switch (action.id) {
        case EncryptedFileActionId.Navigate:
          navigateTo(action.step);
          break;
        case EncryptedFileActionId.GoBack:
          goBack();
          break;
        case EncryptedFileActionId.Finish:
          onClose?.();
          break;
        case EncryptedFileActionId.SetFormValues:
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

  const onSubmit = useCallback<OnSubmit<EncryptedFileForm>>(
    async (data, event) => {
      if (formState.isSubmitting) {
        return;
      }
      try {
        clearError('submit');

        // const transaction = { type: QueuedTransactionType.SendTransaction, data: payload };
        // queueTransaction(transaction);
        // onAction({ id: SendFlowActionId.GenerateTransaction });
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
      fileName,
      queueTransaction,
      setError,
      isDelegatedProvingEnabled,
      faucetId
    ]
  );

  const goToStep = useCallback(
    (step: EncryptedFileStep) => {
      onAction({ id: EncryptedFileActionId.Navigate, step });
    },
    [onAction]
  );

  const onFileNameChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      onAction({
        id: EncryptedFileActionId.SetFormValues,
        payload: { fileName: event.target.value }
      });
    },
    [onAction]
  );

  const handlePasswordChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const fooBar = event.target.value;
      onAction({
        id: EncryptedFileActionId.SetFormValues,
        payload: { filePassword: fooBar }
      });
    },
    [onAction]
  );

  // TODO: Add the components here!
  const renderStep = useCallback(
    (route: Route) => {
      switch (route.name) {
        case EncryptedFileStep.WalletPassword:
          const onGoNext = () => goToStep(EncryptedFileStep.ExportFileName);
          return <EncryptedWalletFileWalletPassword onGoNext={onGoNext} onGoBack={goBack} />;
        case EncryptedFileStep.ExportFileName:
          return (
            <ExportFileName
              onGoBack={goBack}
              onGoNext={() => {
                goToStep(EncryptedFileStep.ExportFilePassword);
              }}
              onFileNameChange={onFileNameChange}
              fileName={fileName}
            />
          );
        case EncryptedFileStep.ExportFilePassword:
          return (
            <ExportFilePassword
              onGoBack={goBack}
              onGoNext={() => {
                goToStep(EncryptedFileStep.ExportFileComplete);
              }}
              handlePasswordChange={handlePasswordChange}
              passwordValue={filePassword ?? ''}
            />
          );
        case EncryptedFileStep.ExportFileComplete:
          return <ExportFileComplete onGoBack={goBack} passwordValue={filePassword ?? ''} />;
        default:
          return <></>;
      }
    },
    [goBack, goToStep, onAction, onClose, fileName, onFileNameChange, filePassword, handlePasswordChange]
  );

  return (
    <div
      // className={classNames(
      //   fullPage
      //     ? 'h-[640px] max-h-[640px] w-[600px] max-w-[600px]'
      //     : 'h-[600px] max-h-[600px] w-[340px] max-w-[340px]',
      //   'mx-auto overflow-hidden ',
      //   'flex flex-1',
      //   'flex-col bg-white',
      //   fullPage && 'border rounded-3xl',
      //   'overflow-hidden relative'
      // )}
      data-testid="encrypted-file-manager-flow"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex">
        <Navigator renderRoute={renderStep} initialRouteName={EncryptedFileStep.WalletPassword} />
      </form>
    </div>
  );
};

const NavigatorWrapper: React.FC<EncryptedFileManagerProps> = props => {
  return (
    <NavigatorProvider routes={ROUTES}>
      <EncryptedFileManager />
    </NavigatorProvider>
  );
};

export { NavigatorWrapper as EncryptedFileFlow };
