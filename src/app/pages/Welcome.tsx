import React, { FC, useCallback, useEffect, useState } from 'react';

import { formatMnemonic } from 'app/defaults';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { useMidenClient } from 'lib/miden/front';
import { navigate, useLocation } from 'lib/woozie';
import { OnboardingFlow } from 'screens/onboarding/navigator';
import { OnboardingAction, OnboardingStep, OnboardingType } from 'screens/onboarding/types';
import { getRandomBytesWithMaxSize } from 'utils/crypto';

const Welcome: FC = () => {
  const { hash } = useLocation();
  const [step, setStep] = useState(OnboardingStep.Welcome);
  const [onboardingType, setOnboardingType] = useState<OnboardingType | null>(null);
  const [walletFileBytes, setWalletFileBytes] = useState<Uint8Array | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { registerWallet } = useMidenClient();
  const { trackEvent } = useAnalytics();

  const register = useCallback(async () => {
    if (password && walletFileBytes) {
      try {
        await registerWallet(password, formatMnemonic(''), onboardingType === OnboardingType.Import);
      } catch (e) {
        console.error(e);
      }
    }
  }, [password, walletFileBytes, onboardingType, registerWallet]);

  const onAction = async (action: OnboardingAction) => {
    let eventCategory = AnalyticsEventCategory.ButtonPress;
    let eventProperties = {};

    switch (action.id) {
      case 'create-wallet':
        setOnboardingType(OnboardingType.Create);
        await setWalletFileBytes(getRandomBytesWithMaxSize());
        navigate('/#create-wallet');
        break;
      case 'import-wallet':
        setOnboardingType(OnboardingType.Import);
        navigate('/#import-wallet');
        break;
      case 'import-wallet-file-submit':
        setWalletFileBytes(action.payload);
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
        if (step === OnboardingStep.ImportWallet || step === OnboardingStep.Welcome) {
          navigate('/');
        } else if (step === OnboardingStep.CreatePassword) {
          navigate('/');
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
        if (!walletFileBytes) {
          navigate('/');
        } else {
          setOnboardingType(OnboardingType.Create);
          setStep(OnboardingStep.CreatePassword);
        }
        break;
      case '#import-wallet':
        setStep(OnboardingStep.ImportWallet);
        setOnboardingType(OnboardingType.Import);
        break;
      case '#create-password':
        if (!walletFileBytes) {
          navigate('/');
        } else {
          setStep(OnboardingStep.CreatePassword);
        }
        break;
      case '#confirmation':
        if (!password || !walletFileBytes) {
          navigate('/');
        } else {
          setStep(OnboardingStep.Confirmation);
        }
        break;
      default:
        break;
    }
  }, [hash, password, walletFileBytes]);

  return <OnboardingFlow onboardingType={onboardingType} step={step} isLoading={isLoading} onAction={onAction} />;
};

export default Welcome;
