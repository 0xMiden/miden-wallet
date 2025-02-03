import React, { FC, useCallback, useEffect, useState } from 'react';

import { generateMnemonic } from 'bip39';
import wordslist from 'bip39/src/wordlists/english.json';

import { formatMnemonic } from 'app/defaults';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { useMidenContext } from 'lib/miden/front';
import { navigate, useLocation } from 'lib/woozie';
import { OnboardingFlow } from 'screens/onboarding/navigator';
import { OnboardingAction, OnboardingStep, OnboardingType, WalletType } from 'screens/onboarding/types';

const Welcome: FC = () => {
  const { hash } = useLocation();
  const [step, setStep] = useState(OnboardingStep.Welcome);
  const [seedPhrase, setSeedPhrase] = useState<string[] | null>(null);
  const [onboardingType, setOnboardingType] = useState<OnboardingType | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [walletType] = useState<WalletType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { registerWallet } = useMidenContext();
  const { trackEvent } = useAnalytics();

  const register = useCallback(async () => {
    if (password && seedPhrase) {
      // Need to determine whether or not to import from the seed or not
      try {
        await registerWallet(
          WalletType.OnChain,
          password,
          formatMnemonic(seedPhrase.join(' ')),
          onboardingType === OnboardingType.Import // might be able to leverage ownMnemonic to determine whther to attempt imports in general
        );
      } catch (e) {
        console.error(e);
      }
    }
  }, [password, onboardingType, registerWallet, seedPhrase]);

  const onAction = async (action: OnboardingAction) => {
    let eventCategory = AnalyticsEventCategory.ButtonPress;
    let eventProperties = {};

    switch (action.id) {
      case 'select-wallet-type':
        setOnboardingType(OnboardingType.Create);
        navigate('/#select-wallet-type');
        break;
      case 'import-wallet':
        setOnboardingType(OnboardingType.Import);
        navigate('/#import-wallet');
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
        if (step === OnboardingStep.ImportWallet || step === OnboardingStep.SelectWalletType) {
          navigate('/');
        } else if (step === OnboardingStep.BackupSeedPhrase) {
          navigate('/#select-wallet-type');
        } else if (step === OnboardingStep.VerifySeedPhrase) {
          navigate('/#backup-seed-phrase');
        } else if (step === OnboardingStep.CreatePassword) {
          if (onboardingType === OnboardingType.Create) {
            navigate('/#verify-seed-phrase');
          } else {
            navigate('/#import-wallet');
          }
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
      case '#import-wallet':
        setStep(OnboardingStep.ImportWallet);
        setOnboardingType(OnboardingType.Import);
        break;
      case '#backup-seed-phrase':
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
      walletType={walletType}
      step={step}
      isLoading={isLoading}
      onAction={onAction}
    />
  );
};

export default Welcome;
