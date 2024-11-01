import React from 'react';

import FormField from 'app/atoms/FormField';
import { useMidenClient } from 'app/hooks/useMidenClient';
import { Icon, IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import { Button } from 'components/Button';
import { T } from 'lib/i18n/react';
import { useAccount } from 'lib/miden/front';
import { useClaimableNotes } from 'lib/miden/front/claimable-notes';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

export interface ReceiveProps {}

export const Receive: React.FC<ReceiveProps> = () => {
  const account = useAccount();
  const address = account.publicKey;
  const { fieldRef, copy } = useCopyToClipboard();
  const { midenClient, midenClientLoading } = useMidenClient();
  const { data: claimableNotes } = useClaimableNotes(account.id);

  const pageTitle = (
    <>
      <T id="receive" />
    </>
  );

  const consumeNote = async (noteId: string) => {
    if (midenClient !== undefined) {
      await midenClient.consumeNoteId(address, noteId);
    }
  };

  return (
    <PageLayout pageTitle={pageTitle}>
      <div className="p-4">
        <FormField ref={fieldRef} value={address} style={{ display: 'none' }} />
        <div className="flex flex-col justify-start gap-y-2">
          <div className="flex justify-between pr-3">
            <div className="flex flex-col">
              <p className="text-xs text-gray-400">Your address</p>
              <p className="text-sm">{address}</p>
            </div>
            <Icon name={IconName.Copy} onClick={copy} style={{ cursor: 'pointer' }} />
          </div>
        </div>
        {claimableNotes !== undefined && claimableNotes.length > 0 && (
          <p className="text-lg mt-10 mb-5">Ready to claim</p>
        )}
        <div className="flex flex-col gap-y-4 p-6">
          {claimableNotes !== undefined &&
            claimableNotes.map(note => (
              <div key={note.id} className="flex justify-between">
                <div className="flex items-center gap-x-2">
                  <Icon name={IconName.ArrowRightDownFilledCircle} size="md" />
                  <p>{`${note.amount} miden`}</p>
                </div>
                <Button disabled={midenClientLoading} onClick={() => consumeNote(note.id)}>
                  <p className="text-white">Claim</p>
                </Button>
              </div>
            ))}
        </div>
      </div>
    </PageLayout>
  );
};
