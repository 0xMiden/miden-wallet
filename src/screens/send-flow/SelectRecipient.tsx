import React, { ChangeEvent } from 'react';

import { Icon, IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { NavigationHeader } from 'components/NavigationHeader';
import { TextArea } from 'components/TextArea';

export interface SelectRecipientProps {
  address?: string;
  onGoBack: () => void;
  onGoNext: () => void;
  onAddressChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onClear: () => void;
  onClose: () => void;
  onCancel: () => void;
}

export const SelectRecipient: React.FC<SelectRecipientProps> = ({
  onGoNext,
  address,
  onAddressChange,
  onClear,
  onClose,
  onCancel
}) => {
  return (
    <div className="flex-1 flex flex-col">
      <NavigationHeader title="Recipient" onClose={onClose} />
      <div className="flex flex-col flex-1 p-4 md:w-[460px] md:mx-auto">
        <div className="flex-1 flex flex-col justify-stretch gap-y-2">
          <div className="relative">
            <TextArea
              placeholder={'Recipient Address'}
              className="w-full pr-10"
              value={address}
              onChange={onAddressChange}
            />
            {address && (
              <button
                type="button"
                onClick={onClear}
                className="absolute top-0 right-0 mt-3 mr-3 "
                aria-label="Clear text"
              >
                <Icon name={IconName.CloseCircle} fill="black" size="md" />
              </button>
            )}
          </div>
        </div>
        <div></div>
        <div className="flex flex-row gap-x-2">
          <Button className="flex-1" title={'Cancel'} variant={ButtonVariant.Secondary} onClick={onCancel} />
          <Button
            className="flex-1"
            title={'Next'}
            variant={ButtonVariant.Primary}
            disabled={false}
            onClick={onGoNext}
          />
        </div>
      </div>
    </div>
  );
};
