import React, { HTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Alert, AlertVariant } from 'components/Alert';
import { Button, ButtonVariant } from 'components/Button';
import { CurrencyInput } from 'components/Input';
import { NavigationHeader } from 'components/NavigationHeader';
import colors from 'utils/tailwind-colors';

import {
  UIFeeType,
  SendTokensAction,
  SendTokensActionId,
  UIBalance,
  UIToken,
  UIFees,
  UITransactionType
} from './types';

export interface FeeOptionsScreenProps extends HTMLAttributes<HTMLDivElement> {
  aleoBalance: UIBalance;
  aleoTokenId: string;
  fee: string;
  feeType: UIFeeType;
  sendType: UITransactionType;
  receiveType: UITransactionType;
  token: UIToken;
  recommendedFees: UIFees;
  error?: string;
  onAction?: (action: SendTokensAction) => void;
}

export const FeeOptionsScreen: React.FC<FeeOptionsScreenProps> = ({
  className,
  aleoBalance,
  aleoTokenId,
  fee,
  feeType,
  sendType,
  receiveType,
  token,
  recommendedFees,
  error,
  onAction,
  ...props
}) => {
  const { t } = useTranslation();

  const [selectedOption, setSelectedOption] = useState<UIFeeType>(feeType);
  const [recommendedFee, setRecommendedFee] = useState<string>('');

  const feeForFeeTypeAndToken = useMemo(() => {
    const recommendedFeeSet = token.id === aleoTokenId ? recommendedFees.ALEO : recommendedFees.OTHER;
    return recommendedFeeSet[sendType][receiveType];
  }, [recommendedFees, sendType, receiveType, token, aleoTokenId]);

  useEffect(() => {
    setSelectedOption(feeType);
    setRecommendedFee(feeForFeeTypeAndToken);
  }, [feeType, feeForFeeTypeAndToken]);

  const options = useMemo(
    () => [
      {
        id: UIFeeType.Public,
        title: 'Public Fee',
        description: 'Transaction fee processed privately.',
        selected: selectedOption === UIFeeType.Public,
        disabled: aleoBalance.public === 0
      },
      {
        id: UIFeeType.Private,
        title: 'Private Fee',
        description: 'Transaction fee is processed publicly on the blockchain.',
        selected: selectedOption === UIFeeType.Private,
        disabled: aleoBalance.private === 0
      }
    ],
    [selectedOption, aleoBalance]
  );

  const onCloseClick = useCallback(
    () =>
      onAction?.({
        id: SendTokensActionId.GoBack
      }),
    [onAction]
  );

  const onConfirmClick = useCallback(() => {
    onCloseClick();
  }, [onCloseClick]);

  const onSelectFeeType = useCallback(
    (feeType: UIFeeType) => {
      setSelectedOption(feeType);
      setRecommendedFee(feeForFeeTypeAndToken);

      onAction?.({
        id: SendTokensActionId.SetFormValues,
        payload: {
          feeType
        }
      });
    },
    [setSelectedOption, onAction, feeForFeeTypeAndToken]
  );

  const onAmountChange = useCallback(
    (
      value: string | undefined,
      name?: string,
      values?: {
        float: number | null;
        formatted: string;
        value: string;
      }
    ) => {
      onAction?.({
        id: SendTokensActionId.SetFormValues,
        payload: {
          feeAmount: value
        },
        triggerValidation: true
      });
    },
    [onAction]
  );

  const alertMessage = useMemo(() => {
    if (aleoBalance.private === 0) {
      return 'You have no Private tokens. Convert Public tokens to Private to use them as Fee.';
    }
    if (aleoBalance.public === 0) {
      return 'You have no Public tokens. Convert Private tokens to Public to use  them as Fee.';
    }
    return undefined;
  }, [aleoBalance]);

  const onConvertClick = useCallback(() => {
    onAction?.({
      id: SendTokensActionId.OpenUrl,
      url: 'transfer-tokens'
    });
  }, [onAction]);

  return (
    <div {...props} className={classNames('flex-1 flex flex-col', className)}>
      <NavigationHeader mode="close" title="Customize fee" onClose={onCloseClick} />
      <div className="flex-1 flex flex-col p-4 md:w-[460px] md:mx-auto">
        {alertMessage ? (
          <Alert
            variant={AlertVariant.Warning}
            className="mb-2 "
            title={
              <>
                {alertMessage}
                <br />
                <button type="button" onClick={onConvertClick} className="text-blue-500">
                  Convert now.
                </button>
              </>
            }
            canDismiss={false}
          />
        ) : null}
        <ul className="space-y-2">
          {options.map(option => (
            <li
              key={option.id}
              className={classNames('flex rounded-lg transition ease-in-out duration-300', {
                border: !option.selected,
                'border-2 border-black': option.selected,
                'border border-grey-100': !option.selected
              })}
            >
              <button
                className={classNames('flex-1 flex flex-col items-stretch p-4', {
                  'cursor-not-allowed': option.disabled
                })}
                onClick={() => onSelectFeeType(option.id)}
                disabled={option.disabled}
                type="button"
              >
                <span className="flex flex-row items-start">
                  <h3
                    className={classNames('flex-1 font-medium text-sm text-left', { 'text-grey-300': option.disabled })}
                  >
                    {option.title}
                  </h3>
                  <Icon
                    name={IconName.CheckboxCircleFill}
                    fill={'black'}
                    size="md"
                    className={option.selected ? '' : 'opacity-0'}
                  />
                </span>
                <p className={classNames('text-xs text-left', { 'text-grey-300': option.disabled })}>
                  {option.description}
                </p>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-y-2 mt-8">
          <h3 className="font-medium text-sm ">Fee</h3>
          <CurrencyInput
            value={fee}
            placeholder={(0).toFixed(2)}
            onValueChange={onAmountChange}
            decimalsLimit={8}
            maxLength={16}
            disableGroupSeparators
            decimalSeparator="."
            icon={
              <p className="text-base text-grey-400">{feeType === UIFeeType.Private ? 'Private' : 'Public'} ALEO</p>
            }
          />
          <p className="text-xs text-grey-600">Recommended fee: {recommendedFee} ALEO</p>
          {error && (
            <span className="flex flex-row items-center gap-x-2">
              <Icon name={IconName.InformationFill} fill={colors.red[500]} size={'xs'} />
              <p className="text-red-500 text-sm">{error}</p>
            </span>
          )}
        </div>
        <span className="flex-1" />
        <Button title={t('confirm')} variant={ButtonVariant.Primary} onClick={onConfirmClick} disabled={!!error} />
      </div>
    </div>
  );
};
