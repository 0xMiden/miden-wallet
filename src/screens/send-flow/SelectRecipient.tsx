import React, { ChangeEvent } from 'react';

import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { NavigationHeader } from 'components/NavigationHeader';
import { TextArea } from 'components/TextArea';

export interface SelectRecipientProps {
  address?: string;
  isValidAddress: boolean;
  error?: string;
  onGoNext: () => void;
  onAddressChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onYourAccounts: () => void;
  onClear: () => void;
  onClose: () => void;
  onCancel: () => void;
}

export const SelectRecipient: React.FC<SelectRecipientProps> = ({
  address,
  isValidAddress,
  error,
  onAddressChange,
  onYourAccounts,
  onGoNext,
  onClear,
  onClose,
  onCancel
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col">
      <NavigationHeader title={t('recipient')} onClose={onClose} />
      <div className="flex flex-col flex-1 p-4 md:w-[460px] md:mx-auto">
        <div className="flex-1 flex flex-col justify-stretch gap-y-2">
          <div className="relative">
            <TextArea
              placeholder={t('recipientAccountId')}
              className="w-full pr-10"
              value={address}
              onChange={onAddressChange}
              autoFocus
            />
            {address && (
              <button
                type="button"
                onClick={onClear}
                className="absolute top-0 right-0 mt-3 mr-3 "
                aria-label={t('clearText')}
              >
                <Icon name={IconName.CloseCircle} fill="black" size="md" />
              </button>
            )}
          </div>
          {error && <p className="text-red-500 text-xs">{t(`${error}`)}</p>}
          <Button
            title={t('yourAccounts')}
            iconLeft={IconName.ContactsBook}
            variant={ButtonVariant.Ghost}
            onClick={onYourAccounts}
          />
        </div>
        <div></div>
        <div className="flex flex-row gap-x-2">
          <Button className="flex-1" title={t('cancel')} variant={ButtonVariant.Secondary} onClick={onCancel} />
          <Button
            className="flex-1"
            title={t('next')}
            variant={ButtonVariant.Primary}
            disabled={!isValidAddress}
            onClick={onGoNext}
          />
        </div>
      </div>
    </div>
  );
};
