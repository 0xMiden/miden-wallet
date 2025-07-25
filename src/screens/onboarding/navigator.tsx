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
import { VerifySeedPhraseScreen } from './create-wallet-flow/VerifySeedPhrase';
import { ImportSeedPhraseScreen } from './import-wallet-flow/ImportSeedPhrase';
import { ImportWalletFileScreen } from './import-wallet-flow/ImportWalletFile';
import { SelectImportTypeScreen } from './import-wallet-flow/SelectImportType';
import { ImportType, OnboardingAction, OnboardingStep, OnboardingType, WalletType } from './types';

export interface OnboardingFlowProps {
  wordslist: string[];
  seedPhrase: string[] | null;
  onboardingType: OnboardingType | null;
  step: OnboardingStep;
  isLoading?: boolean;
  onAction?: (action: OnboardingAction) => void;
}

const Header: React.FC<{
  onBack: () => void;
  step: OnboardingStep;
  onboardingType?: 'import' | 'create' | null;
}> = ({ step, onBack }) => {
  if (step === OnboardingStep.Confirmation || step === OnboardingStep.SelectTransactionType) {
    return null;
  }

  const shouldRenderBackButton = step !== OnboardingStep.Welcome;
  let currentStep: number | null = step === OnboardingStep.Welcome ? null : 3;

  if (step === OnboardingStep.BackupSeedPhrase) {
    currentStep = 1;
  } else if (step === OnboardingStep.VerifySeedPhrase) {
    currentStep = 2;
  } else if (step === OnboardingStep.SelectImportType) {
    currentStep = 1;
  } else if (step === OnboardingStep.CreatePassword) {
    currentStep = 3;
  } else if (step === OnboardingStep.ImportFromSeed || step === OnboardingStep.ImportFromFile) {
    currentStep = 2;
  }

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

      <ProgressIndicator currentStep={currentStep || 1} steps={3} className={currentStep ? '' : 'opacity-0'} />
    </div>
  );
};

export const OnboardingFlow: FC<OnboardingFlowProps> = ({
  wordslist,
  seedPhrase,
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
    const onWelcomeAction = (action: 'select-wallet-type' | 'select-import-type') => {
      switch (action) {
        case 'select-wallet-type':
          onForwardAction?.({
            id: 'create-wallet'
          });
          break;
        case 'select-import-type':
          onForwardAction?.({
            id: 'select-import-type'
          });
          break;
        default:
          break;
      }
    };

    const onSelectImportTypeSubmit = (payload: ImportType) => {
      switch (payload) {
        case ImportType.SeedPhrase:
          onForwardAction?.({
            id: 'import-from-seed'
          });
          break;
        case ImportType.WalletFile:
          onForwardAction?.({
            id: 'import-from-file'
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

    const onImportSeedPhraseSubmit = (seedPhrase: string) =>
      onForwardAction?.({ id: 'import-seed-phrase-submit', payload: seedPhrase });

    const onImportFileSubmit = (seedPhrase: string) => {
      onForwardAction?.({ id: 'import-wallet-file-submit', payload: seedPhrase });
    };

    switch (step) {
      case OnboardingStep.Welcome:
        return <WelcomeScreen onSubmit={onWelcomeAction} />;
      case OnboardingStep.BackupSeedPhrase:
        return <BackUpSeedPhraseScreen seedPhrase={seedPhrase || []} onSubmit={onBackupSeedPhraseSubmit} />;
      case OnboardingStep.VerifySeedPhrase:
        return <VerifySeedPhraseScreen seedPhrase={seedPhrase || []} onSubmit={onVerifySeedPhraseSubmit} />;
      case OnboardingStep.SelectImportType:
        return <SelectImportTypeScreen onSubmit={onSelectImportTypeSubmit} />;
      case OnboardingStep.ImportFromSeed:
        return <ImportSeedPhraseScreen wordslist={wordslist} onSubmit={onImportSeedPhraseSubmit} />;
      case OnboardingStep.ImportFromFile:
        return <ImportWalletFileScreen onSubmit={onImportFileSubmit} />;
      case OnboardingStep.CreatePassword:
        return <CreatePasswordScreen onSubmit={onCreatePasswordSubmit} />;
      case OnboardingStep.SelectTransactionType:
        return <SelectTransactionTypeScreen onSubmit={onSelectTransactionTypeSubmit} />;
      case OnboardingStep.Confirmation:
        return <ConfirmationScreen isLoading={isLoading} onSubmit={onConfirmSubmit} />;

      default:
        return <></>;
    }
  }, [step, isLoading, onForwardAction, seedPhrase, wordslist]);

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
        'bg-white',
        'overflow-hidden'
      )}
    >
      <div className="h-full w-full">
        <AnimatePresence mode={'wait'} initial={false}>
          {step !== OnboardingStep.Confirmation && step !== OnboardingStep.SelectTransactionType && (
            <Header onBack={onBack} step={step} onboardingType={onboardingType} key={'header'} />
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
