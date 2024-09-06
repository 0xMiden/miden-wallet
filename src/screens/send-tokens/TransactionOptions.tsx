import React, { HTMLAttributes, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Chip } from 'components/Chip';
import { InputAmount } from 'components/InputAmount';
import { ListItem } from 'components/ListItem';
import { NavigationHeader } from 'components/NavigationHeader';
import { TabPicker, TabPickerItemProps } from 'components/TabPicker';
import colors from 'utils/tailwind-colors';

import { InfoModalScreen } from './InfoModal';
import {
  SendTokensAction,
  SendTokensActionId,
  SendTokensStep,
  TransactionTypeNameMapping,
  UIToken,
  UITransactionType
} from './types';

export interface TransactionOptionsScreenProps extends HTMLAttributes<HTMLDivElement> {
  aleoTokenId: string;
  token: UIToken;
  sendType: UITransactionType;
  receiveType: UITransactionType;
  amount: string;
  isValid: boolean;
  feeAmount: string;
  error?: string;
  shouldDisplayTransactionType: boolean;
  onAction?: (action: SendTokensAction) => void;
}

const PickerTabs: TabPickerItemProps[] = [
  { id: 'private', title: 'Private' },
  { id: 'public', title: 'Public' },
  { id: 'advanced', title: 'Advanced' }
];

export const TransactionOptionsScreen: React.FC<TransactionOptionsScreenProps> = ({
  className,
  aleoTokenId,
  amount,
  sendType,
  receiveType,
  token,
  feeAmount,
  isValid,
  error,
  shouldDisplayTransactionType,
  onAction,
  ...props
}) => {
  const { t } = useTranslation();
  const [infoModal, setInfoModal] = useState<{ title: string; description: string } | undefined>();
  const [displayFiat, setDisplayFiat] = useState(false);

  const selectedTab = useMemo(() => {
    const transactionTypes = [sendType, receiveType];

    if (transactionTypes.every(type => type === 'private')) {
      return 'private';
    } else if (transactionTypes.every(type => type === 'public')) {
      return 'public';
    } else {
      return 'advanced';
    }
  }, [sendType, receiveType]);

  const tabPickerOptions = useMemo(
    () =>
      PickerTabs.map(tab => {
        let disabled = false;
        let icon: IconName | undefined = undefined;
        let onIconClick: (() => void) | undefined = undefined;
        if (tab.id === 'private' && token.privateBalance === 0) {
          disabled = true;
          icon = IconName.Information;
        } else if (tab.id === 'public' && token.publicBalance === 0) {
          disabled = true;
          icon = IconName.Information;
        }

        return { ...tab, active: tab.id === selectedTab, disabled, icon, onIconClick };
      }),
    [selectedTab, token]
  );

  const onBackClick = useCallback(
    () =>
      onAction?.({
        id: SendTokensActionId.GoBack
      }),
    [onAction]
  );

  const onNextClick = useCallback(
    () =>
      onAction?.({
        id: SendTokensActionId.Navigate,
        step: SendTokensStep.Review
      }),
    [onAction]
  );

  const onTabChange = useCallback(
    (index: number) => {
      const newTab = tabPickerOptions[index];

      if (newTab.disabled) {
        if (newTab.id === 'private') {
          setInfoModal({
            title: 'No Private tokens',
            description:
              'To send Private tokens you should have two records. You need to transfer private/public aleo credits to your wallet.'
          });
        } else if (newTab.id === 'public') {
          setInfoModal({
            title: 'No Public tokens',
            description: 'To send Public tokens you need to transfer private/public aleo credits to your wallet. '
          });
        }
        return;
      }

      if (newTab.id === 'advanced') {
        onAction?.({ id: SendTokensActionId.Navigate, step: SendTokensStep.AdvancedOptions });
      } else {
        onAction?.({
          id: SendTokensActionId.SetFormValues,
          payload: {
            sendType: newTab.id as UITransactionType,
            receiveType: newTab.id as UITransactionType,
            amount: '0'
          },
          triggerValidation: true
        });
      }
    },
    [onAction, tabPickerOptions]
  );

  const onTransactionTypeClick = useCallback(() => {
    onAction?.({
      id: SendTokensActionId.Navigate,
      step: SendTokensStep.AdvancedOptions
    });
  }, [onAction]);

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
        id: SendTokensActionId.SetFormValues,
        payload: {
          amount: value ? values?.formatted : undefined
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
      id: SendTokensActionId.SetFormValues,
      payload: {
        amount: String(maxAmountMinusFee)
      },
      triggerValidation: true
    });
  }, [onAction, sendType, token, feeAmount, aleoTokenId]);

  const onCancelClick = useCallback(
    () =>
      onAction?.({
        id: SendTokensActionId.Finish
      }),
    [onAction]
  );

  const fiatBalance = useCallback((token: UIToken, includePublic = true, includePrivate = true): number => {
    let balanceToShow = 0;
    if (includePublic) {
      balanceToShow += token.publicBalance;
    }
    if (includePrivate) {
      balanceToShow += token.privateBalance;
    }
    return balanceToShow * token.fiatPrice;
  }, []);

  const balanceInfo = useMemo(
    () => [
      {
        id: 'private',
        balance: token.privateBalance,
        fiatBalance: fiatBalance(token, false, true),
        icon: IconName.Lock,
        selected: sendType === UITransactionType.Private
      },
      {
        id: 'public',
        balance: token.publicBalance,
        fiatBalance: fiatBalance(token, true, false),
        icon: IconName.Globe,
        selected: sendType === UITransactionType.Public
      }
    ],
    [token, sendType, fiatBalance]
  );

  const onToggleCurrency = useCallback(() => setDisplayFiat(prevValue => !prevValue), []);
  const usingPrivateBalance = useMemo(() => sendType === UITransactionType.Private, [sendType]);

  return (
    <div {...props} className={classNames('flex-1 flex flex-col relative', className)}>
      <NavigationHeader mode="back" title={`Send ${token.name.toUpperCase()}`} onBack={onBackClick} />
      <div className="flex-1 flex flex-col p-4 md:w-[460px] md:mx-auto">
        <TabPicker tabs={tabPickerOptions} onTabChange={onTabChange} />

        {shouldDisplayTransactionType ? (
          <>
            <ListItem
              className="mt-2"
              title={[TransactionTypeNameMapping[sendType], 'to', TransactionTypeNameMapping[receiveType]].join(' ')}
              iconRight={IconName.ChevronRight}
              onClick={onTransactionTypeClick}
            />
            <hr className="bg-grey-100 mt-2" />
          </>
        ) : null}

        <div className="flex-1 flex flex-col items-center justify-center gap-y-2">
          <InputAmount
            className="self-stretch"
            value={amount}
            label={token.name.toUpperCase()}
            onValueChange={onAmountChangeHandler}
            error={!!error}
            onToggleCurrency={onToggleCurrency}
            displayFiat={displayFiat}
            fiatValue={fiatBalance(token, !usingPrivateBalance, usingPrivateBalance).toString()}
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
                      ${displayFiat ? '' : token.name.toUpperCase()}`}
                  </p>
                </div>
              ))}
            </div>
            <button onClick={onMaxClick} type="button">
              <Chip label="Max" className="cursor-pointer" />
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
      <AnimatePresence mode="wait">
        {infoModal ? (
          <motion.div
            className="absolute top-0 bottom-0 left-0 right-0 flex z-20"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={{
              initial: {
                y: '50vw',
                backgroundColor: 'rgba(0, 0, 0, 0)'
              },
              animate: {
                y: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                transition: {
                  type: 'tween',
                  duration: 0.2,
                  backgroundColor: {
                    delay: 0.2
                  }
                }
              },
              exit: {
                y: '50vw',
                backgroundColor: 'rgba(0, 0, 0, 0)',
                transition: {
                  type: 'tween',
                  backgroundColor: {
                    duration: 0.2
                  },
                  y: { delay: 0.21, duration: 0.4 }
                }
              }
            }}
          >
            <InfoModalScreen
              className="z-50"
              title={infoModal.title}
              description={infoModal.description}
              onClose={() => setInfoModal(undefined)}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
