import React, { HTMLAttributes, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Chip } from 'components/Chip';
import { InputAmount } from 'components/InputAmount';
import { NavigationHeader } from 'components/NavigationHeader';
import colors from 'utils/tailwind-colors';

import {
  ConvertTokensAction,
  ConvertTokensActionId,
  ConvertTokensStep,
  TransactionTypeNameMapping,
  UIToken,
  UITransactionType
} from './types';

export interface TransactionOptionsScreenProps extends HTMLAttributes<HTMLDivElement> {
  records: {
    public: number;
    private: number;
  };
  aleoTokenId: string;
  token: UIToken;
  sendType: UITransactionType;
  receiveType: UITransactionType;
  amount: string;
  isValid: boolean;
  feeAmount: string;
  error?: string;
  onAction?: (action: ConvertTokensAction) => void;
}

export const TransactionOptionsScreen: React.FC<TransactionOptionsScreenProps> = ({
  className,
  aleoTokenId,
  amount,
  sendType,
  receiveType,
  token,
  feeAmount,
  records,
  isValid,
  error,
  onAction,
  ...props
}) => {
  const { t } = useTranslation();
  const [displayFiat, setDisplayFiat] = useState(false);

  const { name: tokenSlug } = token;

  const onBackClick = useCallback(
    () =>
      onAction?.({
        id: ConvertTokensActionId.Finish
      }),
    [onAction]
  );

  const onNextClick = useCallback(
    () =>
      onAction?.({
        id: ConvertTokensActionId.Navigate,
        step: ConvertTokensStep.Review
      }),
    [onAction]
  );

  const onChangeSendReceiveType = useCallback(() => {
    onAction?.({
      id: ConvertTokensActionId.SetFormValues,
      payload: {
        sendType: receiveType,
        receiveType: sendType
      }
    });
  }, [onAction, receiveType, sendType]);

  const onAmountChangeHandler = useCallback(
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
        id: ConvertTokensActionId.SetFormValues,
        payload: {
          amount: values?.formatted
        },
        triggerValidation: true
      });
    },
    [onAction]
  );

  const onMaxClick = useCallback(() => {
    const maxAmount = sendType === UITransactionType.Private ? token.privateBalance : token.publicBalance;
    const maxAmountMinusFee = token.id === aleoTokenId ? maxAmount - Number(feeAmount) : maxAmount;
    onAction?.({
      id: ConvertTokensActionId.SetFormValues,
      payload: {
        amount: String(maxAmountMinusFee)
      },
      triggerValidation: true
    });
  }, [onAction, sendType, token, feeAmount, aleoTokenId]);

  const onCancelClick = useCallback(
    () =>
      onAction?.({
        id: ConvertTokensActionId.Finish
      }),
    [onAction]
  );

  const totalBalance = (token: UIToken): number => token.privateBalance + token.publicBalance;
  const fiatBalance = useCallback((token: UIToken): number => totalBalance(token) * token.fiatPrice, []);

  const balanceInfo = useMemo(
    () => [
      {
        id: 'private',
        balance: token.privateBalance,
        fiatBalance: fiatBalance(token),
        icon: IconName.Lock,
        selected: sendType === UITransactionType.Private
      },
      {
        id: 'public',
        balance: token.publicBalance,
        fiatBalance: fiatBalance(token),
        icon: IconName.Globe,
        selected: sendType === UITransactionType.Public
      }
    ],
    [token, sendType, fiatBalance]
  );

  const onToggleCurrency = useCallback(() => setDisplayFiat(prevValue => !prevValue), []);

  return (
    <div {...props} className={classNames('flex-1 flex flex-col relative', className)}>
      <NavigationHeader title={`${t('convert')} ${tokenSlug.toUpperCase()}`} onClose={onBackClick} />
      <div className="flex-1 flex flex-col p-4 md:w-[460px] md:mx-auto">
        <button
          type={'button'}
          onClick={onChangeSendReceiveType}
          className="flex flex-row bg-grey-50 hover:bg-grey-100 rounded-full py-2 transition duration-300 ease-in-out"
        >
          <div className="flex-1 flex flex-col items-center">
            <p className="text-xs text-grey-600">{t('from')}</p>
            <p className="font-medium text-sm">{TransactionTypeNameMapping[sendType]}</p>
          </div>
          <div className="bg-white rounded-full p-2">
            <Icon name={IconName.ArrowUpDown} size="sm" fill={'black'} className="rotate-90" />
          </div>
          <div className="flex-1 flex flex-col items-center">
            <p className="text-xs text-grey-600">{t('to')}</p>
            <p className="font-medium text-sm">{TransactionTypeNameMapping[receiveType]}</p>
          </div>
        </button>
        <div className="flex-1 flex flex-col items-center justify-center gap-y-2">
          <InputAmount
            value={amount}
            label={tokenSlug.toUpperCase()}
            onValueChange={onAmountChangeHandler}
            error={!!error}
            onToggleCurrency={onToggleCurrency}
            displayFiat={displayFiat}
            fiatValue={fiatBalance(token).toString()}
            autoFocus
          />
          {error && (
            <span className="flex flex-row items-center gap-x-2">
              <Icon name={IconName.InformationFill} fill={colors.red[500]} size={'xs'} />
              <p className="text-red-500 text-sm">{error}</p>
            </span>
          )}
        </div>

        <div className="flex flex-col gap-y-2 ">
          <div className="flex flex-row items-center py-4">
            <div className="flex-1">
              {balanceInfo.map((balance, index) => (
                <div key={index} className="flex flex-row gap-x-2 items-center">
                  <Icon
                    name={balance.icon}
                    fill={balance.selected ? 'black' : colors.grey[300]}
                    size="xs"
                    className="transition duration-300 ease-in-out "
                  />

                  <p
                    className={classNames(
                      'text-xs  transition duration-300 ease-in-out ',
                      balance.selected ? 'black' : 'text-grey-300'
                    )}
                  >
                    {displayFiat ? '$' : ''}
                    {`${displayFiat ? balance.fiatBalance.toFixed(2) : balance.balance.toFixed(2)}
                      ${displayFiat ? '' : tokenSlug.toUpperCase()}`}
                  </p>
                </div>
              ))}
            </div>
            <button onClick={onMaxClick} type="button">
              <Chip label={t('max')} className="cursor-pointer" />
            </button>
          </div>
        </div>
        <div className="flex flex-row gap-x-2">
          <Button className="flex-1" title={t('cancel')} variant={ButtonVariant.Secondary} onClick={onCancelClick} />
          <Button
            className="flex-1"
            title={t('next')}
            variant={ButtonVariant.Primary}
            disabled={!isValid}
            onClick={onNextClick}
          />
        </div>
      </div>
    </div>
  );
};
