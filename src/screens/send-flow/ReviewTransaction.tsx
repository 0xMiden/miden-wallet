import React, { useCallback, useRef, useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { Icon, IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { NavigationHeader } from 'components/NavigationHeader';
import { useAccount } from 'lib/miden/front';

import { RecallBlocksModal } from './RecallBlocksModal';
import { SendFlowAction, SendFlowActionId } from './types';

const TOKEN_NAME = 'MIDEN';

export interface ReviewTransactionProps {
  amount: string;
  onAction: (action: SendFlowAction) => void;
  onGoBack: () => void;
  sharePrivately: boolean;
  delegateTransaction: boolean;
  recipientAddress?: string;
  recallBlocks?: string;
}

export const ReviewTransaction: React.FC<ReviewTransactionProps> = ({
  amount,
  recipientAddress,
  sharePrivately,
  delegateTransaction,
  recallBlocks,
  onAction,
  onGoBack
}) => {
  const { t } = useTranslation();
  const { publicKey } = useAccount();
  const [recallBlocksModalIsOpen, setRecallBlocksModalIsOpen] = useState(false);
  const [recallBlocksInput, setRecallBlocksInput] = useState<string>(recallBlocks || '');
  const [recallBlocksDisplay, setRecallBlocksDisplay] = useState<string>(recallBlocks || ''); // TODO: remove workaround for SetFormValues not rerendering recallBlocks
  const changingRef = useRef(false);
  const delegateTransactionChangingRef = useRef(false);

  const handleDelegateTransactionToggle = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (delegateTransactionChangingRef.current) return;
      delegateTransactionChangingRef.current = true;

      onAction({
        id: SendFlowActionId.SetFormValues,
        payload: { delegateTransaction: evt.target.checked }
      });
      delegateTransactionChangingRef.current = false;
    },
    [onAction]
  );

  const handleSharePrivatelyToggle = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      if (changingRef.current) return;
      changingRef.current = true;

      onAction({
        id: SendFlowActionId.SetFormValues,
        payload: { sharePrivately: evt.target.checked }
      });
      changingRef.current = false;
    },
    [onAction]
  );

  const onBlocksChangeHandler = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRecallBlocksInput(e.target.value);
    },
    [setRecallBlocksInput]
  );

  const onRecallBlocksCancel = useCallback(() => {
    setRecallBlocksInput(recallBlocksDisplay);
    setRecallBlocksModalIsOpen(false);
  }, [setRecallBlocksInput, recallBlocksDisplay, setRecallBlocksModalIsOpen]);

  const onRecallBlocksSubmit = useCallback(() => {
    onAction?.({
      id: SendFlowActionId.SetFormValues,
      payload: {
        recallBlocks: recallBlocksInput
      },
      triggerValidation: false
    });
    setRecallBlocksDisplay(recallBlocksInput);
    setRecallBlocksModalIsOpen(false);
  }, [onAction, recallBlocksInput, setRecallBlocksModalIsOpen]);

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
            <p className="text-sm">{publicKey}</p>
          </span>
          <span className="flex flex-row justify-between whitespace-pre-line">
            <label className="text-sm text-grey-600">To</label>
            <p className="text-sm text-right">{recipientAddress}</p>
          </span>
        </div>

        <hr className="h-px bg-grey-100" />

        <div className="flex flex-col gap-y-2">
          <span className="flex flex-row items-center justify-between py-2">
            <label className="text-sm text-grey-600">Recall blocks</label>
            <div className="flex flex-row items-center">
              <p className={classNames('text-sm text-right mr-4', recallBlocksDisplay ? 'opacity-100' : 'opacity-50')}>
                {recallBlocksDisplay || 'None'}
              </p>
              <Icon
                name={IconName.Settings}
                fill="black"
                className="cursor-pointer"
                onClick={() => setRecallBlocksModalIsOpen(true)}
              />
            </div>
          </span>
        </div>

        <hr className="h-px bg-grey-100" />

        <div className="flex flex-col gap-y-2">
          <span className="flex flex-row items-center justify-between py-2">
            <label className="text-sm text-grey-600">Delegate Transaction</label>
            <div className="flex flex-row items-center">
              <ToggleSwitch
                checked={delegateTransaction}
                onChange={handleDelegateTransactionToggle}
                name="delegateTransaction"
                containerClassName="my-1"
              />
            </div>
          </span>
        </div>

        <hr className="h-px bg-grey-100" />

        <div className="flex flex-col gap-y-2">
          <span className="flex flex-row items-center justify-between py-2">
            <label className="text-sm text-grey-600">Share transaction privately</label>
            <div className="flex flex-row items-center">
              <ToggleSwitch
                checked={sharePrivately}
                onChange={handleSharePrivatelyToggle}
                name="sharePrivately"
                containerClassName="my-1"
              />
            </div>
          </span>
        </div>

        <span className="flex-1" />
        <Button type="submit" title={t('send')} variant={ButtonVariant.Primary} disabled={false} />
      </div>
      <RecallBlocksModal
        isOpen={recallBlocksModalIsOpen}
        parentSelector={() => document.querySelector('#root [data-testid="send-flow"]')!}
        onBlocksChangeHandler={onBlocksChangeHandler}
        onCancel={onRecallBlocksCancel}
        onSubmit={onRecallBlocksSubmit}
        recallBlocksInput={recallBlocksInput}
      />
    </div>
  );
};
