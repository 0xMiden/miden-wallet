import React, { HTMLAttributes, useCallback } from 'react';

import classNames from 'clsx';

import { IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Message } from 'components/Message';
import { NavigationHeader } from 'components/NavigationHeader';

import { SendTokensAction, SendTokensActionId } from './types';

export interface AddTokensScreenProps extends HTMLAttributes<HTMLDivElement> {
  onAction?: (action: SendTokensAction) => void;
}

export const AddTokensScreen: React.FC<AddTokensScreenProps> = ({ className, onAction, ...props }) => {
  const onCloseClick = useCallback(
    () =>
      onAction?.({
        id: SendTokensActionId.Finish
      }),
    [onAction]
  );

  const onFaucetClick = useCallback(
    () =>
      onAction?.({
        id: SendTokensActionId.OpenUrl,
        url: 'faucet'
      }),
    [onAction]
  );

  const onLearnMoreClick = useCallback(
    () =>
      onAction?.({
        id: SendTokensActionId.OpenUrl,
        url: 'transfer-tokens'
      }),
    [onAction]
  );

  return (
    <div {...props} className={classNames('flex-1 flex flex-col', className)}>
      <NavigationHeader mode="close" title="Add tokens" onClose={onCloseClick} />
      <div className="flex-1 flex flex-col justify-center bg-white p-4 md:w-[460px] md:mx-auto">
        <Message
          className="flex-1"
          title="Send Unavailable"
          description="To send private transactions in Aleo, you need 2 private records. Your account has only 1. Fund your wallet to continue."
          icon={IconName.WarningFill}
        />
        <div className="flex flex-col gap-y-4">
          <Button title={'Faucet'} onClick={onFaucetClick} />
          <Button title={'Learn More'} variant={ButtonVariant.Secondary} onClick={onLearnMoreClick} />
        </div>
      </div>
    </div>
  );
};
