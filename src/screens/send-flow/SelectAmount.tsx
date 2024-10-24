import React, { useCallback } from 'react';

import { useTranslation } from 'react-i18next';

import { Button, ButtonVariant } from 'components/Button';
import { Chip } from 'components/Chip';
import { InputAmount } from 'components/InputAmount';
import { NavigationHeader } from 'components/NavigationHeader';
import { SendFlowAction, SendFlowActionId } from 'screens/send-tokens/types';
import { useAccount, useBalance } from 'lib/miden/front';
import { MidenTokens, TOKEN_MAPPING } from 'lib/miden-chain/constants';

export interface SelectAmountProps {
  amount: string;
  onGoBack: () => void;
  onGoNext: () => void;
  onAction?: (action: SendFlowAction) => void;
  onCancel: () => void;
}

const TOKEN_NAME = 'MIDEN';

export const SelectAmount: React.FC<SelectAmountProps> = ({ amount, onGoBack, onGoNext, onAction, onCancel }) => {
  const { t } = useTranslation();
  const { publicKey } = useAccount();

  // TODO: More robust way to toggle faucet type
  const { data: balance } = useBalance(publicKey, TOKEN_MAPPING[MidenTokens.Miden].faucetId);
  // const balance = 10;

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
      console.log('in onAmountChangeHandler');
      console.log(value);
      console.log({ values });
      onAction?.({
        id: SendFlowActionId.SetFormValues,
        payload: {
          amount: value ? values?.formatted : undefined
        },
        triggerValidation: false
      });
    },
    [onAction]
  );

  return (
    <div className="flex-1 flex flex-col relative">
      <NavigationHeader mode="back" title={`Send ${TOKEN_NAME}`} onBack={onGoBack} />
      <div className="flex-1 flex flex-col p-4 md:w-[460px] md:mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center gap-y-2">
          <InputAmount
            className="self-stretch"
            value={amount}
            label={TOKEN_NAME}
            onValueChange={onAmountChangeHandler}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-y-2 ">
          <div className="flex flex-row items-center py-4">
            <div className="flex-1">{balance?.toString()}</div>
            <button
              onClick={() => {
                // TODO: Get this max shit working
                onAction?.({
                  id: SendFlowActionId.SetFormValues,
                  payload: {
                    amount: balance?.toString()
                  },
                  triggerValidation: false
                });
              }}
              type="button"
            >
              <Chip label="Max" className="cursor-pointer" />
            </button>
          </div>
        </div>
        <div className="flex flex-row gap-x-2">
          <Button className="flex-1" title={t('cancel')} variant={ButtonVariant.Secondary} onClick={onCancel} />
          <Button
            className="flex-1"
            title={t('next')}
            variant={ButtonVariant.Primary}
            disabled={false}
            onClick={onGoNext}
          />
        </div>
      </div>
    </div>
  );
};
