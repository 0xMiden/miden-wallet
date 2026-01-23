import React from 'react';

import { useTranslation } from 'react-i18next';

import { IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Message } from 'components/Message';

const MAX_BIOMETRIC_ATTEMPTS = 3;

export interface ConfirmationScreenProps extends React.ButtonHTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
  biometricAttempts?: number;
  biometricError?: string | null;
  onSubmit?: () => void;
  onSwitchToPassword?: () => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  className,
  isLoading,
  biometricAttempts = 0,
  biometricError,
  onSubmit,
  onSwitchToPassword,
  ...props
}) => {
  const { t } = useTranslation();

  const showPasswordFallback = biometricAttempts >= MAX_BIOMETRIC_ATTEMPTS;
  const hasError = biometricError && biometricAttempts > 0;

  return (
    <div {...props} className="flex-1 flex flex-col h-full justify-between bg-white px-10 py-6 gap-y-8">
      <div className="flex flex-col items-center justify-center flex-grow">
        <Message
          icon={IconName.Success}
          iconSize="3xl"
          iconClassName="mb-8"
          title={t('yourWalletIsReady')}
          description={t('explorePrivateAssets')}
        />
        {hasError && (
          <div className="mt-4 text-center">
            <p className="text-red-500 text-sm mb-2">{t('biometricFailed')}</p>
            {!showPasswordFallback && (
              <p className="text-gray-500 text-xs">
                {t('biometricAttemptsRemaining', { count: MAX_BIOMETRIC_ATTEMPTS - biometricAttempts })}
              </p>
            )}
          </div>
        )}
        <div className="flex items-center justify-center gap-x-1" />
      </div>
      <div className="flex flex-col mt-auto items-center gap-y-3">
        {showPasswordFallback ? (
          <>
            <Button
              tabIndex={0}
              title={t('continueWithPassword')}
              className="w-[360px] self-center"
              onClick={onSwitchToPassword}
            />
            <Button
              tabIndex={0}
              title={t('tryBiometricAgain')}
              variant={ButtonVariant.Secondary}
              className="w-[360px] self-center"
              onClick={onSubmit}
              isLoading={isLoading}
            />
          </>
        ) : (
          <Button
            tabIndex={0}
            title={hasError ? t('retry') : t('getStarted')}
            className="w-[360px] self-center"
            onClick={onSubmit}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
