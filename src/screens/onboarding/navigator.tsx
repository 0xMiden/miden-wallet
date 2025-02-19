import React, { FC, useCallback, useState } from 'react';

import classNames from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

import { Icon, IconName } from 'app/icons/v2';
import { ProgressIndicator } from 'components/ProgressIndicator';
import { SquareButton } from 'components/SquareButton';

import { ConfirmationScreen } from './common/Confirmation';
import { CreatePasswordScreen } from './common/CreatePassword';
import { WelcomeScreen } from './common/Welcome';
import { BackUpSeedPhraseScreen } from './create-wallet-flow/BackUpSeedPhrase';
import { SelectTransactionTypeScreen } from './create-wallet-flow/SelectTransactionType';
import { SelectWalletTypeScreen } from './create-wallet-flow/SelectWalletType';
import { VerifySeedPhraseScreen } from './create-wallet-flow/VerifySeedPhrase';
import { OnboardingAction, OnboardingStep, OnboardingType, WalletType } from './types';
import { ImportSeedPhraseScreen } from './import-wallet-flow/ImportSeedPhrase';

export interface OnboardingFlowProps {
  wordslist: string[];
  seedPhrase: string[] | null;
  onboardingType: OnboardingType | null;
  walletType: WalletType | null;
  step: OnboardingStep;
  isLoading?: boolean;
  onAction?: (action: OnboardingAction) => void;
}

const Header: React.FC<{
  onBack: () => void;
  step: OnboardingStep;
  walletType: WalletType | null;
  onboardingType?: 'import' | 'create' | null;
}> = ({ walletType, onboardingType, step, onBack }) => {
  if (step === OnboardingStep.Confirmation || step === OnboardingStep.SelectTransactionType) {
    return null;
  }

  const shouldRenderBackButton = step !== OnboardingStep.Welcome;
  let currentStep: number | null =
    step === OnboardingStep.Welcome || step === OnboardingStep.SelectWalletType ? null : 3;

  if (step === OnboardingStep.BackupSeedPhrase) {
    currentStep = 1;
  } else if (step === OnboardingStep.VerifySeedPhrase) {
    currentStep = 2;
  } else if (step === OnboardingStep.ImportWallet) {
    currentStep = 1;
  } else if (step === OnboardingStep.CreatePassword) {
    if (onboardingType === 'create' && walletType === WalletType.OffChain) {
      currentStep = null;
    } else {
      currentStep = 3;
    }
  }
  const steps = onboardingType === 'import' ? 2 : 3;

  return (
    <div className="flex justify-between items-center pt-6 px-6">
      <SquareButton
        icon={IconName.ArrowLeft}
        onClick={onBack}
        className={shouldRenderBackButton ? '' : 'opacity-0 pointer-events-none'}
      />

      <Icon
        name={IconName.LeoLogoAndName}
        style={{
          width: 228,
          height: 24
        }}
      />

      <ProgressIndicator currentStep={currentStep || 1} steps={steps} className={currentStep ? '' : 'opacity-0'} />
    </div>
  );
};

export const OnboardingFlow: FC<OnboardingFlowProps> = ({
  wordslist,
  seedPhrase,
  walletType,
  onboardingType,
  step,
  isLoading,
  onAction
}) => {
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward');

  const onForwardAction = useCallback(
    (onboardingAction: OnboardingAction) => {
      setNavigationDirection('forward');
      onAction?.(onboardingAction);
    },
    [onAction]
  );

  const renderStep = useCallback(() => {
    const onWelcomeAction = (action: 'select-wallet-type' | 'import') => {
      switch (action) {
        case 'select-wallet-type':
          onForwardAction?.({
            id: 'select-wallet-type'
          });
          break;
        case 'import':
          onForwardAction?.({
            id: 'import-wallet'
          });
          break;
        default:
          break;
      }
    };

    const onSelectWalletTypeSubmit = (payload: WalletType) => {
      switch (payload) {
        case WalletType.OnChain:
          onForwardAction?.({
            id: 'backup-seed-phrase'
          });
          break;
        case WalletType.OffChain:
          onForwardAction?.({
            id: 'create-password',
            payload: payload
          });
          break;
        default:
          break;
      }
    };

    const onBackupSeedPhraseSubmit = () =>
      onForwardAction?.({
        id: 'verify-seed-phrase'
      });

    const onVerifySeedPhraseSubmit = () =>
      onForwardAction?.({
        id: 'create-password',
        payload: WalletType.OnChain
      });

    const onCreatePasswordSubmit = (password: string) =>
      onForwardAction?.({ id: 'create-password-submit', payload: password });

    const onSelectTransactionTypeSubmit = () =>
      onForwardAction?.({ id: 'select-transaction-type', payload: 'private' });

    const onConfirmSubmit = () => onForwardAction?.({ id: 'confirmation' });

    // const onImportWalletFileSubmit = (walletFileBytes: Uint8Array) =>
    //   onForwardAction?.({ id: 'import-wallet-file-submit', payload: walletFileBytes });

    const onImportSeedPhraseSubmit = (seedPhrase: string) =>
      onForwardAction?.({ id: 'import-seed-phrase-submit', payload: seedPhrase });

    switch (step) {
      case OnboardingStep.Welcome:
        return <WelcomeScreen onSubmit={onWelcomeAction} />;
      case OnboardingStep.SelectWalletType:
        return <SelectWalletTypeScreen onSubmit={onSelectWalletTypeSubmit} />;
      case OnboardingStep.BackupSeedPhrase:
        return <BackUpSeedPhraseScreen seedPhrase={seedPhrase || []} onSubmit={onBackupSeedPhraseSubmit} />;
      case OnboardingStep.VerifySeedPhrase:
        return <VerifySeedPhraseScreen seedPhrase={seedPhrase || []} onSubmit={onVerifySeedPhraseSubmit} />;
      case OnboardingStep.ImportWallet:
        return <ImportSeedPhraseScreen wordslist={wordslist} onSubmit={onImportSeedPhraseSubmit} />;
      case OnboardingStep.CreatePassword:
        return <CreatePasswordScreen onSubmit={onCreatePasswordSubmit} />;
      case OnboardingStep.SelectTransactionType:
        return <SelectTransactionTypeScreen onSubmit={onSelectTransactionTypeSubmit} />;
      case OnboardingStep.Confirmation:
        return <ConfirmationScreen isLoading={isLoading} onSubmit={onConfirmSubmit} />;

      default:
        return <></>;
    }
  }, [step, isLoading, onForwardAction, seedPhrase]);

  const onBack = () => {
    setNavigationDirection('backward');
    onAction?.({ id: 'back' });
  };

  return (
    <div
      className={classNames(
        'w-[37.5rem] h-[40rem] mx-auto',
        'flex flex-col',
        'rounded-3xl',
        step === OnboardingStep.Welcome ? 'bg-gradient-to-br from-purple-200 via-white to-white' : 'bg-white',
        'overflow-hidden'
      )}
    >
      <div className="h-full w-full">
        <AnimatePresence mode={'wait'} initial={false}>
          {step !== OnboardingStep.Confirmation && step !== OnboardingStep.SelectTransactionType && (
            <Header
              onBack={onBack}
              step={step}
              walletType={walletType}
              onboardingType={onboardingType}
              key={'header'}
            />
          )}
        </AnimatePresence>
        <AnimatePresence mode={'wait'} initial={false}>
          <motion.div
            className="h-full"
            key={step}
            initial="initialState"
            animate="animateState"
            exit="exitState"
            transition={{
              type: 'tween',
              duration: 0.2
            }}
            variants={{
              initialState: {
                x: navigationDirection === 'forward' ? '1vw' : '-1vw',
                opacity: 0
              },
              animateState: {
                x: 0,
                opacity: 1
              },
              exitState: {
                x: navigationDirection === 'forward' ? '-1vw' : '1vw',
                opacity: 0
              }
            }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
