import React, { FC, useCallback, useEffect, useState } from 'react';

import { generateMnemonic } from 'bip39';
import wordslist from 'bip39/src/wordlists/english.json';

import { formatMnemonic } from 'app/defaults';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { authenticate, checkBiometricAvailability, setBiometricEnabled, storeCredential } from 'lib/biometric';
import { useMidenContext } from 'lib/miden/front';
import { useMobileBackHandler } from 'lib/mobile/useMobileBackHandler';
import { isMobile } from 'lib/platform';
import { WalletStatus, WalletAccount } from 'lib/shared/types';
import { useWalletStore } from 'lib/store';
import { fetchStateFromBackend } from 'lib/store/hooks/useIntercomSync';
import { navigate, useLocation } from 'lib/woozie';
import { OnboardingFlow } from 'screens/onboarding/navigator';
import { ImportType, OnboardingAction, OnboardingStep, OnboardingType } from 'screens/onboarding/types';

/**
 * Wait for the wallet state to become Ready after registration.
 * This ensures the state is fully synced before navigation.
 */
async function waitForReadyState(syncFromBackend: (state: any) => void, maxAttempts = 10): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const state = await fetchStateFromBackend(0);
      syncFromBackend(state);
      if (state.status === WalletStatus.Ready) {
        return;
      }
    } catch (error) {
      console.warn('Failed to fetch state, retrying...', error);
    }
    await new Promise(r => setTimeout(r, 100));
  }
}

const Welcome: FC = () => {
  const { hash } = useLocation();
  const [step, setStep] = useState(OnboardingStep.Welcome);
  const [seedPhrase, setSeedPhrase] = useState<string[] | null>(null);
  const [onboardingType, setOnboardingType] = useState<OnboardingType | null>(null);
  const [importType, setImportType] = useState<ImportType | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [importedWithFile, setImportedWithFile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importedWalletAccounts, setImportedWalletAccounts] = useState<WalletAccount[]>([]);
  const [skForImportedAccounts, setSkForImportedAccounts] = useState<Record<string, string>>({});
  const { registerWallet, importWalletFromClient } = useMidenContext();
  const { trackEvent } = useAnalytics();
  const syncFromBackend = useWalletStore(s => s.syncFromBackend);

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
          await importWalletFromClient(password, seedPhraseFormatted, importedWalletAccounts, skForImportedAccounts);
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
    importedWalletAccounts,
    skForImportedAccounts
  ]);

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
        setImportType(ImportType.WalletFile);
        navigate('/#import-from-file');
        break;
      case 'import-wallet-file-submit':
        const seedPhrase = action.payload.split(' ');
        setSeedPhrase(seedPhrase);
        setImportedWalletAccounts(action.walletAccounts);
        setSkForImportedAccounts(action.skForImportedAccounts);
        setImportedWithFile(true);
        navigate('/#create-password');
        break;
      case 'import-from-seed':
        setImportType(ImportType.SeedPhrase);
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
        setPassword(action.payload.password);
        eventCategory = AnalyticsEventCategory.FormSubmit;

        // Handle biometric setup if enabled (mobile only)
        // We do auth + credential storage NOW (before confirmation screen)
        // but set the preference flag AFTER registration (since clearStorage() wipes preferences)
        if (action.payload.enableBiometric && isMobile()) {
          try {
            const availability = await checkBiometricAvailability();
            if (availability.isAvailable) {
              // Prompt for biometric auth
              const authenticated = await authenticate('Set up biometric unlock');
              if (authenticated) {
                // Store credential in device keystore (NOT cleared by clearStorage)
                await storeCredential(action.payload.password);
                setEnableBiometric(true);
                console.log('[Welcome] Biometric credential stored successfully');
              } else {
                console.log('[Welcome] Biometric auth canceled by user');
                setEnableBiometric(false);
              }
            }
          } catch (err) {
            console.error('[Welcome] Failed to setup biometric credential:', err);
            setEnableBiometric(false);
          }
        } else {
          setEnableBiometric(false);
        }

        // Go directly to confirmation
        navigate('/#confirmation');
        break;
      case 'confirmation':
        setIsLoading(true);
        await register();
        // Wait for state to be synced before navigating
        // This fixes a race condition where navigation happens before state is Ready
        await waitForReadyState(syncFromBackend);

        // Set biometric preference flag AFTER registration completes
        // (Credential was already stored in create-password-submit, but preference
        // must be set after register() because Vault.spawn() calls clearStorage())
        if (enableBiometric) {
          try {
            await setBiometricEnabled(true);
            console.log('[Welcome] Biometric preference enabled');
          } catch (err) {
            console.error('[Welcome] Failed to enable biometric preference:', err);
          }
        }

        setIsLoading(false);
        eventCategory = AnalyticsEventCategory.FormSubmit;
        navigate('/');
        break;
      case 'back':
        if (
          step === OnboardingStep.SelectImportType ||
          step === OnboardingStep.SelectWalletType ||
          step === OnboardingStep.BackupSeedPhrase
        ) {
          navigate('/');
        } else if (step === OnboardingStep.VerifySeedPhrase) {
          navigate('/#backup-seed-phrase');
        } else if (step === OnboardingStep.CreatePassword) {
          if (onboardingType === OnboardingType.Create) {
            navigate('/#verify-seed-phrase');
          } else {
            if (importType === ImportType.WalletFile) {
              navigate('/#import-from-file');
            } else {
              navigate('/#import-from-seed');
            }
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

  // Handle mobile back button/gesture in onboarding flow
  useMobileBackHandler(() => {
    // On welcome screen, let system handle (minimize on Android)
    if (step === OnboardingStep.Welcome) {
      return false;
    }
    // On confirmation/loading screen, don't allow back
    if (step === OnboardingStep.Confirmation && isLoading) {
      return true; // Consume but don't navigate
    }
    // Trigger the onboarding back action
    onAction({ id: 'back' });
    return true;
  }, [step, isLoading, onAction]);

  return (
    <OnboardingFlow
      wordslist={wordslist}
      seedPhrase={seedPhrase}
      onboardingType={onboardingType}
      step={step}
      password={password}
      isLoading={isLoading}
      onAction={onAction}
    />
  );
};

export default Welcome;
