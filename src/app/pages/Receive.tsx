import React, { useEffect } from 'react';

import FormField from 'app/atoms/FormField';
import { Icon, IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import { Button } from 'components/Button';
import { T } from 'lib/i18n/react';
import { useAccount } from 'lib/miden/front';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

export interface ClaimableNote {
  id: string;
  amount: string;
}

export interface ReceiveProps {}

const midenClient = await MidenClientInterface.create();

export const Receive: React.FC<ReceiveProps> = () => {
  const account = useAccount();
  const address = account.publicKey;
  const { fieldRef, copy } = useCopyToClipboard();
  const [claimableNotes, setClaimableNotes] = React.useState<ClaimableNote[]>([]);

  const pageTitle = (
    <>
      <T id="receive" />
    </>
  );

  const fetchNotes = async () => {
    const notes = await midenClient.getCommittedNotes();
    if (notes.length === 0) {
      return;
    }
    setClaimableNotes(
      notes.map(note => ({
        id: note.id().to_string(),
        amount: note.details().assets().assets()[0].amount().toString()
      }))
    );
  };

  useEffect(() => {
    fetchNotes();
    const intervalId = setInterval(fetchNotes, 2000);
    return () => clearInterval(intervalId);
  }, []);

  const consumeNote = async (noteId: string) => {
    await midenClient.consumeNoteId(address, noteId);
    setClaimableNotes(claimableNotes.filter(note => note.id !== noteId));
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
        {claimableNotes.length > 0 && <p className="text-lg mt-10 mb-5">Ready to claim</p>}
        <div className="flex flex-col gap-y-4 p-6">
          {claimableNotes.map(note => (
            <div key={note.id} className="flex justify-between">
              <div className="flex items-center gap-x-2">
                <Icon name={IconName.ArrowRightDownFilledCircle} size="md" />
                <p>{`${note.amount} miden`}</p>
              </div>
              <Button onClick={() => consumeNote(note.id)}>
                <p className="text-white">Claim</p>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};
