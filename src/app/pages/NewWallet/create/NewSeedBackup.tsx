import React, { FC, useEffect } from 'react';

import { useForm } from 'react-hook-form';

import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import { ReactComponent as RefreshIcon } from 'app/icons/refresh.svg';
import { ReactComponent as WarningIcon } from 'app/icons/warning-alt.svg';
import { OnboardingSelectors } from 'app/pages/Onboarding.selectors';
import { useAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

interface BackupFormData {
  backuped: boolean;
}

interface NewSeedBackupProps {
  seedPhrase: string;
  onBackupComplete: () => void;
  changeSeedPhrase: () => void;
}

export const NewSeedBackup: FC<NewSeedBackupProps> = ({ seedPhrase, onBackupComplete, changeSeedPhrase }) => {
  const { trackEvent } = useAnalytics();
  useEffect(() => {
    trackEvent(OnboardingSelectors.CreateNewWalletButton);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { fieldRef, copy, copied } = useCopyToClipboard();
  const { handleSubmit, formState } = useForm<BackupFormData>();
  const submitting = formState.isSubmitting;

  return (
    <div className="w-full mx-auto mt-4 text-black">
      <div className="mb-8">
        <span className="text-black font-normal text-xs">{t('youWillNeedThisSeedPhrase')}</span>
      </div>

      <div
        className="flex w-full mx-auto text-center rounded-lg bg-yellow-500 mt-8"
        style={{ fontSize: '14px', lineHeight: '20px', padding: '24px' }}
      >
        <WarningIcon stroke={'none'} style={{ height: '16px', width: '40px', marginTop: '2px' }} />
        <div className="flex flex-col px-2 text-left text-black">
          <span className="font-medium" style={{ fontSize: '14px', lineHeight: '20px', marginBottom: '4px' }}>
            {t('doNotSharePhrase1')} <br />
          </span>
          <span className="text-xs">{t('doNotSharePhrase2')}</span>
        </div>
      </div>

      <FormField
        ref={fieldRef}
        secret
        textarea
        rows={2}
        readOnly
        labelDescription={t('youWillNeedThisSeedPhrase')}
        id="backup-mnemonic"
        spellCheck={false}
        containerClassName="mt-8 mb-4"
        className="resize-none notranslate text-black text-center py-12"
        value={seedPhrase}
        onClick={copy}
      />

      <form className="w-full flex flex-col justify-end" onSubmit={handleSubmit(onBackupComplete)}>
        <div className="flex w-full justify-center mt-4">
          <div className="w-1/2" style={{ textAlign: 'center' }}>
            <span
              onClick={changeSeedPhrase}
              className="font-medium text-base hover:bg-gray-900 px-6 py-4 rounded-lg"
              style={{ cursor: 'pointer' }}
            >
              <RefreshIcon className="h-6 w-6 mr-1" style={{ display: 'inline' }} />
              <T id="changeSeedPhrase" />
            </span>
          </div>
          <div className="w-1/2" style={{ textAlign: 'center' }}>
            <span
              onClick={copy}
              className="font-medium text-base hover:bg-gray-900 px-6 py-4 rounded-lg"
              style={{ cursor: 'pointer' }}
            >
              <CopyIcon className="h-6 w-6 mr-1" style={{ display: 'inline' }} />
              {copied ? (
                <T id="copiedAddress" />
              ) : (
                <>
                  <T id="copyAddressToClipboard" />
                </>
              )}
            </span>
          </div>
        </div>

        <FormSubmitButton
          loading={submitting}
          className="w-full text-base py-4 mb-2 mx-auto"
          style={{ display: 'block', fontWeight: 500, padding: '12px 0px', marginTop: '100px' }}
          testID={OnboardingSelectors.NewSeedPhraseButton}
        >
          <T id="next" />
        </FormSubmitButton>
      </form>
    </div>
  );
};
