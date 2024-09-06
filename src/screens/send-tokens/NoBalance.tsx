import React, { HTMLAttributes, useCallback } from 'react';

import classNames from 'clsx';

import { IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Message } from 'components/Message';
import { NavigationHeader } from 'components/NavigationHeader';

import { SendTokensAction, SendTokensActionId } from './types';

export interface NoBalanceScreenProps extends HTMLAttributes<HTMLDivElement> {
  onAction?: (action: SendTokensAction) => void;
}

export const NoBalanceScreen: React.FC<NoBalanceScreenProps> = ({ className, onAction, ...props }) => {
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

  const onTransferTokensClick = useCallback(
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
      <div className="flex-1 flex flex-col p-4 justify-center bg-white md:w-[460px] md:mx-auto">
        <Message
          className="flex-1"
          title="Get tokens"
          description="You can get tokens from our faucet or transfer them from another wallet or account."
          icon={IconName.Coins}
        />
        <div className="flex flex-col gap-y-4">
          <Button title={'Faucet'} onClick={onFaucetClick} />
          <Button title={'Transfer Tokens'} variant={ButtonVariant.Secondary} onClick={onTransferTokensClick} />
        </div>
      </div>
    </div>
  );
};
