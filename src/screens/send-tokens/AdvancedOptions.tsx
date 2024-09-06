import React, { HTMLAttributes, useCallback, useMemo } from 'react';

import classNames from 'clsx';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Alert, AlertVariant } from 'components/Alert';
import { Button, ButtonVariant } from 'components/Button';
import { NavigationHeader } from 'components/NavigationHeader';
import { TabPicker, TabPickerItemProps } from 'components/TabPicker';
import colors from 'utils/tailwind-colors';

import { SendTokensAction, SendTokensActionId, TransactionTypeNameMapping, UIToken, UITransactionType } from './types';

export interface AdvancedOptionsScreenProps extends HTMLAttributes<HTMLDivElement> {
  token: UIToken;
  sendType: UITransactionType;
  receiveType: UITransactionType;
  onAction?: (action: SendTokensAction) => void;
}

export const AdvancedOptionsScreen: React.FC<AdvancedOptionsScreenProps> = ({
  className,
  token,
  sendType,
  receiveType,
  onAction,
  ...props
}) => {
  const { t } = useTranslation();

  const sendTabOptions = useMemo<TabPickerItemProps[]>(
    () => [
      { id: 'private', title: 'Private', active: sendType === 'private', disabled: token.privateBalance === 0 },
      { id: 'public', title: 'Public', active: sendType === 'public', disabled: token.publicBalance === 0 }
    ],
    [sendType, token]
  );
  const recieveTabOptions = useMemo<TabPickerItemProps[]>(
    () => [
      { id: 'private', title: 'Private', active: receiveType === 'private' },
      { id: 'public', title: 'Public', active: receiveType === 'public' }
    ],
    [receiveType]
  );

  const onCloseClick = useCallback(() => onAction?.({ id: SendTokensActionId.GoBack }), [onAction]);
  const onConfirmClick = useCallback(() => {
    onCloseClick();
  }, [onCloseClick]);

  const onSendTypeChange = useCallback(
    (index: number) => {
      if (sendTabOptions[index].disabled) {
        return;
      }
      onAction?.({
        id: SendTokensActionId.SetFormValues,
        payload: { sendType: sendTabOptions[index].id as UITransactionType }
      });
    },
    [sendTabOptions, onAction]
  );

  const onReceiveTypeChange = useCallback(
    (index: number) => {
      if (recieveTabOptions[index].disabled) {
        return;
      }
      onAction?.({
        id: SendTokensActionId.SetFormValues,
        payload: { receiveType: recieveTabOptions[index].id as UITransactionType }
      });
    },
    [recieveTabOptions, onAction]
  );

  const transactionCardInfo = useMemo(() => {
    const descriptions: Record<string, string> = {
      private_private: 'All transaction details remain confidential.',
      public_public: 'All transaction details are publicly accessible on the blockchain.',
      private_public: 'You send credits anonymously, while the recipient receives them publicly.',
      public_private: 'You send credits publicly, while the recipient receives them anonymously.'
    };

    const icons = {
      public: IconName.Globe,
      private: IconName.Lock
    };

    const transactionKey = `${sendType}_${receiveType}`;
    const description = descriptions[transactionKey] || 'Transaction type not supported.';

    return {
      title: [TransactionTypeNameMapping[sendType], 'to', TransactionTypeNameMapping[receiveType]].join(' '),
      description,
      iconLeft: icons[sendType],
      iconRight: icons[receiveType]
    };
  }, [sendType, receiveType]);

  const alertMessage = useMemo(() => {
    if (token.privateBalance === 0) {
      return 'You have no Private tokens. Convert Public tokens to Private to send.';
    }
    if (token.publicBalance === 0) {
      return 'You have no Public tokens. Convert Private tokens to Public to send.';
    }
    return undefined;
  }, [token]);

  const onConvertClick = useCallback(() => {
    onAction?.({
      id: SendTokensActionId.OpenUrl,
      url: 'buy-tokens'
    });
  }, [onAction]);

  return (
    <div {...props} className={classNames('flex-1 flex flex-col ', className)}>
      <NavigationHeader mode="close" title="Advanced send" onClose={onCloseClick} />

      <div className="flex-1 flex flex-col p-4 md:w-[460px] md:mx-auto">
        {alertMessage ? (
          <Alert
            variant={AlertVariant.Warning}
            className="mb-2"
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

        <div className="flex flex-col gap-y-4">
          <div className="flex flex-row items-center">
            <p className="flex-1 text-sm font-medium">You send</p>
            <TabPicker tabs={sendTabOptions} onTabChange={onSendTypeChange} />
          </div>
          <span className="h-px bg-grey-100" />
          <div className="flex flex-row items-center">
            <p className="flex-1 text-sm font-medium">Recipient receives</p>
            <TabPicker tabs={recieveTabOptions} onTabChange={onReceiveTypeChange} />
          </div>
          <motion.div
            key={transactionCardInfo.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="border border-grey-100 rounded-[19px] flex flex-col items-center py-8 px-4"
          >
            <span className="flex gap-x">
              <Icon name={transactionCardInfo.iconLeft} fill="black" />
              <Icon name={IconName.ArrowRight} fill={colors.grey[300]} />
              <Icon name={transactionCardInfo.iconRight} fill="black" />
            </span>
            <p className="text-base font-medium leading-6 mt-2">{transactionCardInfo.title}</p>
            <p className="text-sm font-normal leading-5 text-center">{transactionCardInfo.description}</p>
          </motion.div>
        </div>

        <div className="flex-1 flex flex-col items-stretch justify-end">
          <Button title={t('Confirm')} variant={ButtonVariant.Primary} onClick={onConfirmClick} />
        </div>
      </div>
    </div>
  );
};
