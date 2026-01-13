import React, { HTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Alert, AlertVariant } from 'components/Alert';
import { Button, ButtonVariant } from 'components/Button';
import { CurrencyInput } from 'components/Input';
import { NavigationHeader } from 'components/NavigationHeader';
import colors from 'utils/tailwind-colors';

import { UIFeeType, ConvertTokensAction, ConvertTokensActionId, UIBalance } from './types';

export interface FeeOptionsScreenProps extends HTMLAttributes<HTMLDivElement> {
  aleoBalance: UIBalance;
  fee: string;
  feeType: UIFeeType;
  recommendedFee: string;
  error?: string;
  onAction?: (action: ConvertTokensAction) => void;
}

export const FeeOptionsScreen: React.FC<FeeOptionsScreenProps> = ({
  className,
  aleoBalance,
  fee,
  feeType,
  recommendedFee,
  error,
  onAction,
  ...props
}) => {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState<UIFeeType>(feeType);

  const privateBalanceForFee = aleoBalance.private || 0;
  const publicBalanceForFee = aleoBalance.public || 0;

  useEffect(() => {
    setSelectedOption(feeType);
  }, [feeType]);

  const options = useMemo(
    () => [
      {
        id: UIFeeType.Public,
        title: t('publicFee'),
        description: t('publicFeeDescription'),
        selected: selectedOption === UIFeeType.Public,
        disabled: publicBalanceForFee === 0
      },
      {
        id: UIFeeType.Private,
        title: t('privateFee'),
        description: t('privateFeeDescription'),
        selected: selectedOption === UIFeeType.Private,
        disabled: privateBalanceForFee === 0
      }
    ],
    [selectedOption, privateBalanceForFee, publicBalanceForFee, t]
  );

  const onCloseClick = useCallback(
    () =>
      onAction?.({
        id: ConvertTokensActionId.GoBack
      }),
    [onAction]
  );

  const onConfirmClick = useCallback(() => {
    onCloseClick();
  }, [onCloseClick]);

  const onSelectFeeType = useCallback(
    (feeType: UIFeeType) => {
      setSelectedOption(feeType);
      onAction?.({
        id: ConvertTokensActionId.SetFormValues,
        payload: {
          feeType
        },
        triggerValidation: true
      });
    },
    [setSelectedOption, onAction]
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
        id: ConvertTokensActionId.SetFormValues,
        payload: {
          feeAmount: value
        }
      });
    },
    [onAction]
  );

  const alertMessage = useMemo(() => {
    if (privateBalanceForFee === 0) {
      return t('noPrivateTokensForFee');
    }
    if (publicBalanceForFee === 0) {
      return t('noPublicTokensForFee');
    }
    return undefined;
  }, [privateBalanceForFee, publicBalanceForFee, t]);

  const onConvertClick = useCallback(() => {
    onAction?.({
      id: ConvertTokensActionId.OpenUrl,
      url: 'buy-tokens'
    });
  }, [onAction]);

  return (
    <div {...props} className={classNames('flex-1 flex flex-col', className)}>
      <NavigationHeader mode="close" title={t('customizeFee')} onClose={onCloseClick} />
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
                  {t('convertNow')}
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
          <h3 className="font-medium text-sm ">{t('fee')}</h3>
          <CurrencyInput
            value={fee}
            placeholder={(0).toFixed(2)}
            onValueChange={onAmountChange}
            decimalsLimit={8}
            maxLength={16}
            disableGroupSeparators
            decimalSeparator="."
            icon={
              <p className="text-base text-grey-400">{feeType === UIFeeType.Private ? t('private') : t('public')} ALEO</p>
            }
          />
          <p className="text-xs text-grey-600">{t('recommendedFee')}: {recommendedFee} ALEO</p>
          {error && (
            <span className="flex flex-row items-center gap-x-2">
              <Icon name={IconName.InformationFill} fill={colors.red[500]} size={'xs'} />
              <p className="text-red-500 text-sm">{error}</p>
            </span>
          )}
        </div>
        <span className="flex-1" />
        <Button title={t('confirm')} variant={ButtonVariant.Primary} onClick={onConfirmClick} />
      </div>
    </div>
  );
};
