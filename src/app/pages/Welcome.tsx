import React, { FC, useCallback, useEffect, useState } from 'react';

import { generateMnemonic } from 'bip39';

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
  const [isLoading, setIsLoading] = useState(false);
  const { registerWallet } = useMidenContext();
  const { trackEvent } = useAnalytics();

  const register = useCallback(async () => {
    if (password && seedPhrase) {
      try {
        await registerWallet(password, formatMnemonic(seedPhrase.join(' ')), onboardingType === OnboardingType.Import);
      } catch (e) {
        console.error(e);
      }
    }
  }, [password, onboardingType, registerWallet, seedPhrase]);

  const onAction = async (action: OnboardingAction) => {
    let eventCategory = AnalyticsEventCategory.ButtonPress;
    let eventProperties = {};

    switch (action.id) {
      case 'create-wallet':
        setSeedPhrase(generateMnemonic(128).split(' '));
        setOnboardingType(OnboardingType.Create);
        navigate('/#create-wallet');
        break;
      case 'verify-seed-phrase':
        navigate('/#verify-seed-phrase');
        break;
      case 'import-wallet':
        setOnboardingType(OnboardingType.Import);
        navigate('/#import-wallet');
        break;
      case 'import-wallet-file-submit':
        navigate('/#create-password');
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
        if (step === OnboardingStep.ImportWallet || step === OnboardingStep.BackupWallet) {
          navigate('/');
        } else if (step === OnboardingStep.VerifySeedPhrase) {
          navigate('/#create-wallet');
        } else if (step === OnboardingStep.CreatePassword) {
          navigate(onboardingType === OnboardingType.Create ? '/#verify-seed-phrase' : '/#import-wallet');
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
      case '#create-wallet':
        setOnboardingType(OnboardingType.Create);
        setStep(OnboardingStep.BackupWallet);
        break;
      case '#backup-wallet':
        setStep(OnboardingStep.BackupWallet);
        break;
      case '#verify-seed-phrase':
        setStep(OnboardingStep.VerifySeedPhrase);
        break;
      case '#import-wallet':
        setStep(OnboardingStep.ImportWallet);
        setOnboardingType(OnboardingType.Import);
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
      seedPhrase={seedPhrase}
      onboardingType={onboardingType}
      step={step}
      isLoading={isLoading}
      onAction={onAction}
    />
  );
};

export default Welcome;
