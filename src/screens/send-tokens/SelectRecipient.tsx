import React, { ChangeEvent, HTMLAttributes, useCallback } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Loader } from 'components/Loader';
import { NavigationHeader } from 'components/NavigationHeader';
import { TextArea } from 'components/TextArea';
import colors from 'utils/tailwind-colors';

import { SendTokensAction, SendTokensActionId, SendTokensStep, UIBalance, UIToken } from './types';

export interface SelectRecipientScreenProps extends HTMLAttributes<HTMLDivElement> {
  aleoRecordCount: number;
  token: UIToken;
  aleoBalance: UIBalance;
  aleoTokenId: string;
  address?: string;
  isValid?: boolean;
  isLoading?: boolean;
  canGoBack?: boolean;
  error?: string;
  onAction?: (action: SendTokensAction) => void;
}

export const SelectRecipientScreen: React.FC<SelectRecipientScreenProps> = ({
  className,
  aleoRecordCount,
  token,
  aleoBalance,
  aleoTokenId,
  address,
  isValid,
  isLoading,
  canGoBack = true,
  error,
  onAction,
  ...props
}) => {
  const { t } = useTranslation();
  const onContactsClick = useCallback(
    () =>
      onAction?.({
        id: SendTokensActionId.Navigate,
        step: SendTokensStep.ContactsList
      }),
    [onAction]
  );

  const onNextClick = useCallback(() => {
    const usingMtsp = token.id !== aleoTokenId;
    const canSend = usingMtsp
      ? (aleoRecordCount > 0 || aleoBalance.public > 0) && (token.privateBalance > 0 || token.publicBalance > 0)
      : aleoRecordCount >= 2 || aleoBalance.public > 0;
    onAction?.({
      id: SendTokensActionId.Navigate,
      step: canSend ? SendTokensStep.TransactionOptions : SendTokensStep.AddTokens
    });
  }, [onAction, aleoRecordCount, aleoTokenId, token, aleoBalance]);

  const onBackClick = useCallback(
    () =>
      onAction?.({
        id: SendTokensActionId.GoBack
      }),
    [onAction]
  );

  const onCancelClick = useCallback(
    () =>
      onAction?.({
        id: SendTokensActionId.Finish
      }),
    [onAction]
  );

  const onChangeText = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) =>
      onAction?.({
        id: SendTokensActionId.SetFormValues,
        payload: { recipientAddressInput: event.target.value }
      }),
    [onAction]
  );

  const handleClear = () => {
    onAction?.({
      id: SendTokensActionId.SetFormValues,
      payload: { recipientAddressInput: '' }
    });
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = '48px';
    }
  };

  return (
    <div {...props} className={classNames('flex-1 flex flex-col ', className)}>
      <NavigationHeader title="Recipient" onBack={canGoBack ? onBackClick : undefined} />
      <div className="flex flex-col flex-1 p-4 md:w-[460px] md:mx-auto">
        <div className="flex-1 flex flex-col justify-stretch gap-y-2">
          <div className="relative">
            <TextArea
              placeholder={'Aleo address or ANS name'}
              className="w-full pr-10"
              value={address}
              onChange={onChangeText}
            />
            {address && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-0 right-0 mt-3 mr-3 "
                aria-label="Clear text"
              >
                <Icon name={IconName.CloseCircle} fill="black" size="md" />
              </button>
            )}
          </div>
          {error && !isLoading && <p className="text-red-500 text-xs">{error}</p>}
          {isLoading && (
            <span className="flex flex-row gap-x-1 items-center">
              <Loader size="xs" color={colors.grey[600]} />
              <p className="text-grey-600 text-xs">{t('Checking...')}</p>
            </span>
          )}
          <Button
            title={'Contacts'}
            iconLeft={IconName.ContactsBook}
            variant={ButtonVariant.Ghost}
            onClick={onContactsClick}
          />
        </div>
        <div className="flex flex-row gap-x-2">
          <Button className="flex-1" title={'Cancel'} variant={ButtonVariant.Secondary} onClick={onCancelClick} />
          <Button
            className="flex-1"
            title={'Next'}
            variant={ButtonVariant.Primary}
            disabled={!isValid}
            onClick={onNextClick}
          />
        </div>
      </div>
    </div>
  );
};
