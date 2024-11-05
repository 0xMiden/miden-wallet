import React, { useCallback } from 'react';

import FormField from 'app/atoms/FormField';
import { openLoadingFullPage } from 'app/env';
import { Icon, IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import { isDelegateProofEnabled } from 'app/templates/DelegateSettings';
import { Button, ButtonVariant } from 'components/Button';
import { T } from 'lib/i18n/react';
import { useAccount } from 'lib/miden/front';
import { useClaimableNotes } from 'lib/miden/front/claimable-notes';
import { useQueuedTransactions } from 'lib/miden/front/queued-transactions';
import { QueuedTransactionType } from 'lib/miden/types';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

export interface ReceiveProps {}

export const Receive: React.FC<ReceiveProps> = () => {
  const account = useAccount();
  const address = account.publicKey;
  const { fieldRef, copy } = useCopyToClipboard();
  const { data: claimableNotes } = useClaimableNotes(address);
  const isDelegatedProvingEnabled = isDelegateProofEnabled();
  const [, queueTransaction] = useQueuedTransactions();

  const pageTitle = (
    <>
      <T id="receive" />
    </>
  );

  const consumeNote = useCallback(
    (noteId: string) => {
      const transaction = {
        type: QueuedTransactionType.ConsumeNoteId,
        data: {
          address: account.publicKey,
          noteId,
          delegateTransaction: isDelegatedProvingEnabled
        }
      };

      queueTransaction(transaction);
      openLoadingFullPage();
      const index = claimableNotes?.findIndex(note => note.id === noteId);
      if (index !== undefined && index !== -1) {
        claimableNotes?.splice(index, 1);
      }
    },
    [account, isDelegatedProvingEnabled, queueTransaction, claimableNotes]
  );

  return (
    <PageLayout pageTitle={pageTitle} showBottomBorder={false}>
      <div className="p-4">
        <FormField ref={fieldRef} value={address} style={{ display: 'none' }} />
        <div className="flex flex-col justify-start gap-y-2">
          <div className="flex justify-center items-center gap-24">
            <div className="flex flex-col">
              <p className="text-xs text-gray-400">Your address</p>
              <p className="text-sm">{address}</p>
            </div>
            <Icon name={IconName.Copy} onClick={copy} style={{ cursor: 'pointer' }} />
          </div>
          <div className="w-1/2 mx-auto" style={{ borderBottom: '1px solid #E9EBEF' }}></div>
        </div>
        {claimableNotes !== undefined && claimableNotes.length > 0 && (
          <p className="text-xs text-gray-400 mt-10 mb-5">Ready to claim</p>
        )}
        <div className="flex flex-col gap-y-4 p-6">
          {claimableNotes !== undefined &&
            claimableNotes.map(note => (
              <div key={note.id} className="flex justify-center items-center">
                <div className="flex items-center gap-x-2">
                  <Icon name={IconName.ArrowRightDownFilledCircle} size="lg" />
                  <div className="flex flex-col gap-y-2">
                    <p className="text-lg">{`${note.amount} MIDEN`}</p>
                    {/* <p className="text-xs text-gray-400">{note.senderAddress}</p> */}
                  </div>
                </div>
                <Button variant={ButtonVariant.Primary} onClick={() => consumeNote(note.id)} title="Claim" />
              </div>
            ))}
        </div>
      </div>
    </PageLayout>
  );
};
