import React, { FC, useCallback, useState } from 'react';

import { generateMnemonic } from 'bip39';
import wordsList from 'bip39/src/wordlists/english.json';

import { formatMnemonic } from 'app/defaults';
import { useMidenContext } from 'lib/miden/front';
import { clearClientStorage } from 'lib/miden/reset';
import { useMobileBackHandler } from 'lib/mobile/useMobileBackHandler';
import type { WalletAccount } from 'lib/shared/types';
import { navigate } from 'lib/woozie';
import { ForgotPasswordFlow } from 'screens/onboarding/forgot-password-navigator';
import { ForgotPasswordAction, ForgotPasswordStep, OnboardingType } from 'screens/onboarding/types';

const ForgotPassword: FC = () => {
  const [step, setStep] = useState(ForgotPasswordStep.Welcome);
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const [onboardingType, setOnboardingType] = useState<OnboardingType | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [importedWithFile, setImportedWithFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importedWalletAccounts, setImportedWalletAccounts] = useState<WalletAccount[]>([]);

  const { registerWallet, importWalletFromClient } = useMidenContext();

  const register = useCallback(async () => {
    if (password && seedPhrase) {
      clearClientStorage();

      const seedPhraseFormatted = formatMnemonic(seedPhrase.join(' '));
      if (!importedWithFile) {
        try {
          await registerWallet(
            password,
            seedPhraseFormatted,
            onboardingType === OnboardingType.Import // might be able to leverage ownMnemonic to determine whther to attempt imports in general
          );
        } catch (e) {
          console.error(e);
        }
      } else {
        try {
          console.log('importing wallet from client');
          await importWalletFromClient(password, seedPhraseFormatted, importedWalletAccounts);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [
    password,
    seedPhrase,
    importedWithFile,
    registerWallet,
    onboardingType,
    importWalletFromClient,
    importedWalletAccounts
  ]);

  const onAction = useCallback(
    async (action: ForgotPasswordAction) => {
      switch (action.id) {
        case 'create-wallet':
          setSeedPhrase(generateMnemonic(128).split(' '));
          setOnboardingType(OnboardingType.Create);
          setStep(ForgotPasswordStep.BackupSeedPhrase);
          break;
        case 'select-import-type':
          setOnboardingType(OnboardingType.Import);
          setStep(ForgotPasswordStep.SelectImportType);
          break;
        case 'import-from-file':
          setStep(ForgotPasswordStep.ImportFromFile);
          break;
        case 'import-wallet-file-submit':
          const seedPhrase = action.payload.split(' ');
          setSeedPhrase(seedPhrase);
          setImportedWalletAccounts(action.walletAccounts);
          setImportedWithFile(true);
          setStep(ForgotPasswordStep.CreatePassword);
          break;
        case 'import-from-seed':
          setStep(ForgotPasswordStep.ImportFromSeed);
          break;
        case 'import-seed-phrase-submit':
          setSeedPhrase(action.payload.split(' '));
          setStep(ForgotPasswordStep.CreatePassword);
          break;
        case 'backup-seed-phrase':
          setSeedPhrase(generateMnemonic(128).split(' '));
          setStep(ForgotPasswordStep.BackupSeedPhrase);
          break;
        case 'verify-seed-phrase':
          setStep(ForgotPasswordStep.VerifySeedPhrase);
          break;
        case 'create-password':
          setStep(ForgotPasswordStep.CreatePassword);
          break;
        case 'create-password-submit':
          setPassword(action.payload.password);
          setStep(ForgotPasswordStep.Confirmation);
          break;
        case 'confirmation':
          setIsLoading(true);
          await register();
          setIsLoading(false);
          navigate('/');
          break;
        case 'back':
          if (step === ForgotPasswordStep.SelectImportType) {
            setStep(ForgotPasswordStep.Welcome);
          } else if (step === ForgotPasswordStep.VerifySeedPhrase) {
            setStep(ForgotPasswordStep.BackupSeedPhrase);
          } else if (step === ForgotPasswordStep.BackupSeedPhrase) {
            setStep(ForgotPasswordStep.Welcome);
          } else if (step === ForgotPasswordStep.CreatePassword) {
            if (onboardingType === OnboardingType.Create) {
              setStep(ForgotPasswordStep.VerifySeedPhrase);
            } else {
              setStep(ForgotPasswordStep.ImportFromSeed);
            }
          } else if (step === ForgotPasswordStep.ImportFromFile || step === ForgotPasswordStep.ImportFromSeed) {
            setStep(ForgotPasswordStep.SelectImportType);
          }
          break;
        default:
          break;
      }
    },
    [register, step, onboardingType]
  );

  // Handle mobile back button/gesture in forgot password flow
  useMobileBackHandler(() => {
    // On welcome screen, go back to unlock page
    if (step === ForgotPasswordStep.Welcome) {
      navigate('/');
      return true;
    }
    // On confirmation/loading screen, don't allow back
    if (step === ForgotPasswordStep.Confirmation && isLoading) {
      return true; // Consume but don't navigate
    }
    // Trigger the forgot password back action
    onAction({ id: 'back' });
    return true;
  }, [step, isLoading, onAction]);

  return (
    <ForgotPasswordFlow
      step={step}
      seedPhrase={seedPhrase}
      wordsList={wordsList}
      isLoading={isLoading}
      onAction={onAction}
      onboardingType={onboardingType}
    />
  );
};

export default ForgotPassword;
