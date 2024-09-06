import React, { FC, useCallback, useEffect, useState } from 'react';

import { useForm } from 'react-hook-form';

import { OnboardingSelectors } from 'app/pages/Onboarding.selectors';
import { useAnalytics } from 'lib/analytics';

import { T, t } from '../../../../lib/i18n/react';
import FormSubmitButton from '../../../atoms/FormSubmitButton';
import { SeedPhraseInput } from '../../../atoms/SeedPhraseInput';

interface ImportFromSeedPhraseProps {
  seedPhrase: string;
  setSeedPhrase: (seed: string) => void;
  setIsSeedEntered: (value: boolean) => void;
}

export const ImportFromSeedPhrase: FC<ImportFromSeedPhraseProps> = ({
  seedPhrase,
  setSeedPhrase,
  setIsSeedEntered
}) => {
  const { trackEvent } = useAnalytics();
  useEffect(() => {
    trackEvent(OnboardingSelectors.ImportWalletButton);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { handleSubmit, formState, reset } = useForm();
  const [seedError, setSeedError] = useState('');

  const onSubmit = useCallback(() => {
    if (seedPhrase && !seedPhrase.split(' ').includes('') && !seedError) {
      setIsSeedEntered(true);
    } else if (seedError === '') {
      setSeedError(t('mnemonicWordsAmountConstraint'));
    }
  }, [seedPhrase, seedError, setIsSeedEntered]);

  return (
    <form className="w-full mx-auto my-8 px-8 pb-4" onSubmit={handleSubmit(onSubmit)}>
      <SeedPhraseInput
        isFirstAccount
        label={t('seedPhrase')}
        submitted={formState.submitCount !== 0}
        seedError={seedError}
        onChange={setSeedPhrase}
        setSeedError={setSeedError}
        reset={reset}
      />
      <FormSubmitButton
        className="w-full text-base py-4 mt-8 mb-2 mx-auto"
        style={{ display: 'block', fontWeight: 500, padding: '12px 0px' }}
        testID={OnboardingSelectors.ConfirmExistingSeedPhraseButton}
      >
        <T id="next" />
      </FormSubmitButton>
    </form>
  );
};
