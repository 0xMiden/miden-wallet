import { Icon, IconName } from 'app/icons/v2';
import { AmountLabel } from 'components/AmountLabel';
import { Button, ButtonVariant } from 'components/Button';
import { NavigationHeader } from 'components/NavigationHeader';
import React from 'react';

import { useTranslation } from 'react-i18next';

import { SendFlowAction } from 'screens/send-tokens/types';
import colors from 'utils/tailwind-colors';

const TOKEN_NAME = 'MIDEN';

export interface ReviewTransactionProps {
  amount: string;
  onGoBack: () => void;
  recipientAddress?: string;
}

export const ReviewTransaction: React.FC<ReviewTransactionProps> = ({ amount, recipientAddress, onGoBack }) => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col">
      <NavigationHeader mode="back" title="Review" onBack={onGoBack} />
      <div className="flex flex-col flex-1 p-4 gap-y-4 md:w-[460px] md:mx-auto">
        <span className="flex flex-row items-end gap-x-2 justify-center p-6">
          <p className="text-2xl leading-8">{`${amount} ${TOKEN_NAME}`}</p>
        </span>

        <div className="flex flex-col gap-y-2">
          <span className="flex flex-row justify-between">
            <label className="text-sm text-grey-600">From</label>
            <p className="text-sm">SEND ADDRESS</p>
          </span>
          <span className="flex flex-row justify-between whitespace-pre-line">
            <label className="text-sm text-grey-600">To</label>
            <p className="text-sm text-right">{recipientAddress}</p>
          </span>
          <span className="flex flex-row justify-between">
            <label className="text-sm text-grey-600">Send Type</label>
          </span>
        </div>

        <hr className="h-px bg-grey-100" />

        <span className="flex-1" />
        <Button type="submit" title={t('send')} variant={ButtonVariant.Primary} disabled={false} />
      </div>
    </div>
  );
};
