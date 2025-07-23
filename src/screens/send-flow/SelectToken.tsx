import React, { HTMLAttributes, useCallback } from 'react';

import classNames from 'clsx';
import { formatValue } from 'react-currency-input-field';

import { AssetIcon } from 'app/templates/AssetIcon';
import { Button, ButtonVariant } from 'components/Button';
import { CardItem } from 'components/CardItem';
import { NavigationHeader } from 'components/NavigationHeader';

import { SendFlowAction, SendFlowActionId, SendFlowStep, UIToken } from './types';

export interface SelectTokenScreenProps extends HTMLAttributes<HTMLDivElement> {
  tokens?: UIToken[];
  onAction?: (action: SendFlowAction) => void;
}

export const SelectToken: React.FC<SelectTokenScreenProps> = ({ className, tokens, onAction, ...props }) => {
  const onCancel = useCallback(() => {
    onAction?.({
      id: SendFlowActionId.Finish
    });
  }, [onAction]);

  const onSelectToken = useCallback(
    (token: UIToken) => {
      onAction?.({
        id: SendFlowActionId.SetFormValues,
        payload: {
          token
        }
      });
      onAction?.({
        id: SendFlowActionId.Navigate,
        step: SendFlowStep.SelectRecipient
      });
    },
    [onAction]
  );

  const fiatBalance = (token: UIToken): number => token.balance * token.fiatPrice;

  return (
    <div {...props} className={classNames('flex-1 flex flex-col ', className)}>
      <NavigationHeader mode="close" title="Choose Token" onClose={onCancel} />
      <div className="flex flex-col flex-1 p-4 justify-between md:w-[460px] md:mx-auto">
        <div className="flex-1">
          {tokens?.map(token => (
            <CardItem
              key={token.id}
              title={token.name.toUpperCase()}
              titleRight={formatValue({
                value: token.balance.toString()
              })}
              subtitleRight={['≈ ', '$', fiatBalance(token)].join('')}
              iconLeft={
                <AssetIcon
                  assetSlug={token.name.toLowerCase()}
                  assetId={token.id}
                  size={token.name.toLowerCase() === 'miden' ? 24 : 34}
                  className="mr-2 flex-shrink-0 rounded bg-white"
                />
              }
              onClick={() => onSelectToken(token)}
              hoverable
            />
          ))}
        </div>
        <Button title={'Cancel'} variant={ButtonVariant.Secondary} onClick={onCancel} />
      </div>
    </div>
  );
};
