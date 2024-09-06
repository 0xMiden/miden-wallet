import React, { HTMLAttributes, useCallback, useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Alert, AlertVariant } from 'components/Alert';
import { AmountLabel } from 'components/AmountLabel';
import { Button, ButtonVariant } from 'components/Button';
import { NavigationHeader } from 'components/NavigationHeader';
import { SquareButton } from 'components/SquareButton';
import { Toggle } from 'components/Toggle';
import { Tooltip } from 'components/Tooltip';
import colors from 'utils/tailwind-colors';

import {
  ConvertTokensAction,
  ConvertTokensActionId,
  ConvertTokensStep,
  TransactionTypeNameMapping,
  UIFeeType,
  UIToken,
  UITransactionType
} from './types';

export interface ReviewScreenProps extends HTMLAttributes<HTMLDivElement> {
  amount: string;
  token: UIToken;
  sendType: UITransactionType;
  receiveType: UITransactionType;
  sendAddress: string;
  isLoading: boolean;
  feeAmount: string;
  delegateTransaction: boolean;
  feeType: UIFeeType;
  isValid: boolean;
  error?: string;
  onAction?: (action: ConvertTokensAction) => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  className,
  amount,
  token,
  sendType,
  receiveType,
  sendAddress,
  isLoading,
  delegateTransaction,
  isValid,
  feeAmount,
  feeType,
  error,
  onAction,
  ...props
}) => {
  const { t } = useTranslation();

  const { name: tokenSlug } = token;

  const onBackClick = () => onAction?.({ id: ConvertTokensActionId.GoBack });
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const onToggleDelegate = (value: boolean) =>
    onAction?.({
      id: ConvertTokensActionId.SetFormValues,
      payload: {
        delegateTransaction: value
      }
    });

  const onInfoMouseEnter = useCallback(() => {
    setIsTooltipVisible(true);
  }, []);

  const onInfoMouseLeave = useCallback(() => {
    setTimeout(() => setIsTooltipVisible(false), 300);
  }, []);

  const onFeeOptionsClick = useCallback(
    () =>
      onAction?.({
        id: ConvertTokensActionId.Navigate,
        step: ConvertTokensStep.FeeOptions
      }),
    [onAction]
  );

  return (
    <div {...props} className={classNames('flex-1 flex flex-col', className)}>
      <NavigationHeader mode="back" title="Review" onBack={onBackClick} />
      <div className="flex flex-col flex-1 p-4 gap-y-4 md:w-[460px] md:mx-auto">
        <span className="flex flex-row items-end gap-x-2 justify-center p-6">
          <AmountLabel amount={amount} />
          <p className="text-2xl leading-8">{`${tokenSlug.toUpperCase()}`}</p>
        </span>

        <div className="flex flex-col gap-y-2">
          <span className="flex flex-row justify-between">
            <label className="text-sm text-grey-600">Convert</label>
            <p className="text-sm">
              {TransactionTypeNameMapping[sendType]} to {TransactionTypeNameMapping[receiveType]}
            </p>
          </span>
        </div>

        <hr className="h-px bg-grey-100" />

        <div className="flex flex-row gap-x-2">
          <div className="flex-1 flex flex-col">
            <span className="flex flex-row justify-between">
              <label className="text-sm text-grey-600">Fee type</label>
              <p className="text-sm">{feeType === UIFeeType.Private ? 'Private' : 'Public'}</p>
            </span>
            <span className="flex flex-row justify-end">
              <p className="text-sm">{feeAmount} ALEO</p>
            </span>
          </div>
          <SquareButton className="self-center" icon={IconName.Settings} onClick={onFeeOptionsClick} color="black" />
        </div>
        {error ? <Alert title={error} variant={AlertVariant.Error} /> : null}

        <hr className="h-px bg-grey-100" />

        <div className="flex flex-row justify-between items-center ">
          <span className="flex flex-row gap-x-1">
            <p className="text-sm text-grey-600">Delegate this transaction</p>
            <div className="relative">
              <Icon
                name={IconName.Information}
                fill={colors.grey[600]}
                size="sm"
                onMouseEnter={onInfoMouseEnter}
                onMouseLeave={onInfoMouseLeave}
              />

              <div
                className={classNames(
                  'absolute z-10 -left-[90px] bottom-[170%] w-[200px] transition duration-300 ease-in-out',
                  {
                    'opacity-0 pointer-events-none': !isTooltipVisible,
                    'opacity-100 pointer-events-auto': isTooltipVisible
                  }
                )}
              >
                <Tooltip
                  arrowPosition="bottom"
                  title="Configure delegation of proof generation to a remote server. This will speed up proof generation but disclose the transaction details to a trusted server."
                />
              </div>
            </div>
          </span>
          <Toggle value={delegateTransaction} onChangeValue={onToggleDelegate} />
        </div>

        <span className="flex-1" />
        <Button
          type="submit"
          title={t('send')}
          variant={ButtonVariant.Primary}
          disabled={!isValid}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
