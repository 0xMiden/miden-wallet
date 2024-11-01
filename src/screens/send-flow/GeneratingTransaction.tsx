import React, { HTMLAttributes, useCallback } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import CircularProgress from 'app/atoms/CircularProgress';
import { Icon, IconName } from 'app/icons/v2';
import { Alert, AlertVariant } from 'components/Alert';
import { Button, ButtonVariant } from 'components/Button';
import { SendFlowAction, SendFlowActionId } from 'screens/send-tokens/types';

export interface GeneratingTransactionProps extends HTMLAttributes<HTMLDivElement> {
  transactionComplete: boolean;
  submitError: boolean;
  onAction?: (action: SendFlowAction) => void;
}

export const GeneratingTransaction: React.FC<GeneratingTransactionProps> = ({
  transactionComplete,
  submitError: error,
  onAction,
  ...props
}) => {
  const { t } = useTranslation();

  const onDoneClick = useCallback(() => onAction?.({ id: SendFlowActionId.Finish }), [onAction]);

  return (
    <div {...props} className={classNames('flex-1 flex flex-col p-4 ')}>
      <Alert
        variant={AlertVariant.Warning}
        title="Do not close this window. Window will auto-close after the transaction is generated"
      />
      <div className="flex-1 flex flex-col justify-center md:w-[460px] md:mx-auto">
        <div {...props} className="flex flex-col justify-center items-center">
          <div
            className={classNames(
              'w-40 aspect-square flex items-center justify-center',
              'rounded-full bg-gradient-to-t from-white to-[#F9F9F9]'
            )}
          >
            {transactionComplete && <Icon name={IconName.CheckboxCircleFill} size="xxl" />}
            {!transactionComplete && !error && (
              <CircularProgress borderWeight={6} progress={80} circleColor="black" circleSize={50} spin={true} />
            )}
          </div>
          <div className="flex flex-col items-center">
            <h1 className="font-semibold text-2xl lh-title">
              {transactionComplete && 'Transaction Completed'}
              {!transactionComplete && !error && 'Generating Transaction'}
              {error && 'Transaction Failed'}
            </h1>
            <p className="text-base text-center lh-title">
              {transactionComplete && 'Your transaction was successfully processed and confirmed on the network.'}
              {error && 'There was an error processing your transaction. Please try again.'}
            </p>
          </div>
        </div>
        <Button
          title={t('done')}
          className="mt-8"
          variant={ButtonVariant.Primary}
          onClick={onDoneClick}
          disabled={!transactionComplete && !error}
        />
      </div>
    </div>
  );
};
