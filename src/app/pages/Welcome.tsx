import React, { FC, useCallback, useEffect, useState } from 'react';

import { generateMnemonic } from 'bip39';

import { formatMnemonic } from 'app/defaults';
import { setDelegateProofSetting } from 'app/templates/DelegateSettings';
import { useAleoClient } from 'lib/aleo/front';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { navigate, useLocation } from 'lib/woozie';
import { OnboardingFlow } from 'screens/onboarding/navigator';
import { OnboardingAction, OnboardingStep, OnboardingType } from 'screens/onboarding/types';

const Welcome: FC = () => {
  const { hash } = useLocation();
  const [step, setStep] = useState(OnboardingStep.Welcome);
  const [onboardingType, setOnboardingType] = useState<OnboardingType | null>(null);
  const [seedPhrase, setSeedPhrase] = useState<string[] | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { registerWallet } = useAleoClient();
  const { trackEvent } = useAnalytics();

  const register = useCallback(async () => {
    if (password && seedPhrase) {
      try {
        await registerWallet(password, formatMnemonic(seedPhrase?.join(' ')), onboardingType === OnboardingType.Import);
      } catch (e) {
        console.error(e);
      }
    }
  }, [password, seedPhrase, onboardingType, registerWallet]);

  const onAction = async (action: OnboardingAction) => {
    let eventCategory = AnalyticsEventCategory.ButtonPress;
    let eventProperties = {};

    switch (action.id) {
      case 'create-wallet':
        setOnboardingType(OnboardingType.Create);
        await setSeedPhrase(generateMnemonic(128).split(' '));
        navigate('/#create-wallet');
        break;
      case 'import-wallet':
        setOnboardingType(OnboardingType.Import);
        navigate('/#import-wallet');
        break;
      case 'import-seed-phrase-submit':
        setSeedPhrase(action.payload.split(' '));
        navigate('/#create-password');
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
        navigate(onboardingType === OnboardingType.Create ? '/#select-transaction-type' : '/#confirmation');
        break;
      case 'select-transaction-type':
        navigate('/#confirmation');
        setDelegateProofSetting(true);
        eventCategory = AnalyticsEventCategory.FormSubmit;
        eventProperties = { transactionType: action.payload };
        break;
      case 'confirmation':
        setIsLoading(true);
        await register();
        setIsLoading(false);
        eventCategory = AnalyticsEventCategory.FormSubmit;
        navigate('/');
        break;
      case 'back':
        if (step === OnboardingStep.BackupWallet || step === OnboardingStep.ImportWallet) {
          navigate('/');
        } else if (step === OnboardingStep.VerifySeedPhrase) {
          navigate('/#create-wallet');
        } else if (step === OnboardingStep.CreatePassword) {
          navigate(onboardingType === OnboardingType.Create ? '/#verify-seed-phrase' : '/#import-wallet');
        } else if (step === OnboardingStep.SelectTransactionType) {
          navigate('/#create-password');
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
        if (!seedPhrase) {
          navigate('/');
        } else {
          setOnboardingType(OnboardingType.Create);
          setStep(OnboardingStep.BackupWallet);
        }
        break;
      case '#import-wallet':
        setStep(OnboardingStep.ImportWallet);
        setOnboardingType(OnboardingType.Import);
        break;
      case '#create-password':
        if (!seedPhrase) {
          navigate('/');
        } else {
          setStep(OnboardingStep.CreatePassword);
        }
        break;
      case '#verify-seed-phrase':
        if (!seedPhrase) {
          navigate('/');
        } else {
          setStep(OnboardingStep.VerifySeedPhrase);
        }
        break;
      case '#select-transaction-type':
        if (!password || !seedPhrase) {
          navigate('/');
        } else {
          setStep(OnboardingStep.SelectTransactionType);
        }
        break;
      case '#confirmation':
        if (!password || !seedPhrase) {
          navigate('/');
        } else {
          setStep(OnboardingStep.Confirmation);
        }
        break;
      default:
        break;
    }
  }, [hash, password, seedPhrase]);

  return (
    <OnboardingFlow
      onboardingType={onboardingType}
      step={step}
      isLoading={isLoading}
      seedPhrase={seedPhrase}
      onAction={onAction}
    />
  );
};

export default Welcome;
