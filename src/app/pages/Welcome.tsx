import React, { FC, useCallback, useEffect, useState } from 'react';

import { generateMnemonic } from 'bip39';
import wordslist from 'bip39/src/wordlists/english.json';

import { formatMnemonic } from 'app/defaults';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { useMidenContext } from 'lib/miden/front';
import { navigate, useLocation } from 'lib/woozie';
import { OnboardingFlow } from 'screens/onboarding/navigator';
import { OnboardingAction, OnboardingStep, OnboardingType } from 'screens/onboarding/types';

const Welcome: FC = () => {
  const { hash } = useLocation();
  const [step, setStep] = useState(OnboardingStep.Welcome);
  const [seedPhrase, setSeedPhrase] = useState<string[] | null>(null);
  const [onboardingType, setOnboardingType] = useState<OnboardingType | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [importedWithFile, setImportedWithFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { registerWallet, importWalletFromClient } = useMidenContext();
  const { trackEvent } = useAnalytics();

  const register = useCallback(async () => {
    if (password && seedPhrase) {
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
          await importWalletFromClient(password, seedPhraseFormatted);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [password, seedPhrase, importedWithFile, registerWallet, onboardingType, importWalletFromClient]);

  const onAction = async (action: OnboardingAction) => {
    let eventCategory = AnalyticsEventCategory.ButtonPress;
    let eventProperties = {};

    switch (action.id) {
      case 'create-wallet':
        setSeedPhrase(generateMnemonic(128).split(' '));
        setOnboardingType(OnboardingType.Create);
        navigate('/#backup-seed-phrase');
        break;
      case 'select-import-type':
        setOnboardingType(OnboardingType.Import);
        navigate('/#select-import-type');
        break;
      case 'import-from-file':
        navigate('/#import-from-file');
        break;
      case 'import-wallet-file-submit':
        const seedPhrase = action.payload.split(' ');
        console.log({ seedPhrase });
        setSeedPhrase(seedPhrase);
        setImportedWithFile(true);
        navigate('/#create-password');
        break;
      case 'import-from-seed':
        navigate('/#import-from-seed');
        break;
      case 'import-seed-phrase-submit':
        setSeedPhrase(action.payload.split(' '));
        navigate('/#create-password');
        break;
      case 'backup-seed-phrase':
        setSeedPhrase(generateMnemonic(128).split(' '));
        navigate('/#backup-seed-phrase');
        break;
      case 'verify-seed-phrase':
        navigate('/#verify-seed-phrase');
        break;
      case 'create-password':
        navigate('/#create-password');
        break;
      case 'create-password-submit':
        setPassword(action.payload);
        eventCategory = AnalyticsEventCategory.FormSubmit;
        navigate('/#confirmation');
        break;
      case 'confirmation':
        setIsLoading(true);
        await register();
        setIsLoading(false);
        eventCategory = AnalyticsEventCategory.FormSubmit;
        navigate('/');
        break;
      case 'back':
        if (step === OnboardingStep.SelectImportType || step === OnboardingStep.SelectWalletType) {
          navigate('/');
        } else if (step === OnboardingStep.VerifySeedPhrase) {
          navigate('/#backup-seed-phrase');
        } else if (step === OnboardingStep.CreatePassword) {
          if (onboardingType === OnboardingType.Create) {
            navigate('/#verify-seed-phrase');
          } else {
            navigate('/#import-wallet');
          }
        } else if (step === OnboardingStep.ImportFromFile || step === OnboardingStep.ImportFromSeed) {
          navigate('/#select-import-type');
        }
        break;
      default:
        break;
    }

    trackEvent(action.id, eventCategory, eventProperties);
  };

  useEffect(() => {
    switch (hash) {
      case '':
        setStep(OnboardingStep.Welcome);
        break;
      case '#select-wallet-type':
        setOnboardingType(OnboardingType.Create);
        setStep(OnboardingStep.SelectWalletType);
        break;
      case '#select-import-type':
        setStep(OnboardingStep.SelectImportType);
        setOnboardingType(OnboardingType.Import);
        break;
      case '#import-from-seed':
        setStep(OnboardingStep.ImportFromSeed);
        break;
      case '#import-from-file':
        setStep(OnboardingStep.ImportFromFile);
        break;
      case '#backup-seed-phrase':
        setOnboardingType(OnboardingType.Create);
        setStep(OnboardingStep.BackupSeedPhrase);
        break;
      case '#verify-seed-phrase':
        setStep(OnboardingStep.VerifySeedPhrase);
        break;
      case '#create-password':
        setStep(OnboardingStep.CreatePassword);
        break;
      case '#confirmation':
        if (!password) {
          navigate('/');
        } else {
          setStep(OnboardingStep.Confirmation);
        }
        break;
      default:
        break;
    }
  }, [hash, password]);

  return (
    <OnboardingFlow
      wordslist={wordslist}
      seedPhrase={seedPhrase}
      onboardingType={onboardingType}
      step={step}
      isLoading={isLoading}
      onAction={onAction}
    />
  );
};

export default Welcome;
