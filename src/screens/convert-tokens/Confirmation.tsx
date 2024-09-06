import React, { HTMLAttributes, useCallback } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Message } from 'components/Message';

import { ConvertTokensAction, ConvertTokensActionId } from './types';

export interface ConfirmationScreenProps extends HTMLAttributes<HTMLDivElement> {
  onAction?: (action: ConvertTokensAction) => void;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({ className, onAction, ...props }) => {
  const { t } = useTranslation();

  const onDoneClick = useCallback(() => onAction?.({ id: ConvertTokensActionId.Finish }), [onAction]);

  return (
    <div {...props} className={classNames('flex-1 flex flex-col p-4 ', className)}>
      <div className="flex-1 flex flex-col justify-center md:w-[460px] md:mx-auto">
        <Message
          className="flex-1"
          title="Conversion Initiated"
          description="Transaction will proceed in the background"
          icon={IconName.CheckboxCircleFill}
        />
        <Button title={t('done')} variant={ButtonVariant.Primary} onClick={onDoneClick} />
      </div>
    </div>
  );
};
