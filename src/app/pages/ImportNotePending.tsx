import React, { FC, useEffect, useState } from 'react';

import CircularProgress from 'app/atoms/CircularProgress';
import { Icon, IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import { useAccount } from 'lib/miden/front';
import { useClaimableNotes } from 'lib/miden/front/claimable-notes';
import { navigate } from 'lib/woozie';

type ImportNotePendingProps = {
  noteId: string;
};

const POLLING_INTERVAL = 5000;
const POLLING_TIMEOUT = 20000;

const ImportNotePending: FC<ImportNotePendingProps> = ({ noteId }) => {
  const account = useAccount();
  const address = account.publicKey;

  const { data: claimableNotes, mutate } = useClaimableNotes(address);

  const [isPolling, setIsPolling] = useState(true);
  const [isNoteFound, setIsNoteFound] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let polling = true;

    const pollForNote = async () => {
      if (!polling) return;

      // Check if the noteId is in the current claimable notes
      if (claimableNotes?.some(note => note !== null && note.id === noteId)) {
        setIsNoteFound(true);
        setIsPolling(false);
        return;
      }

      // Re-fetch claimable notes
      await mutate();

      // Schedule the next poll
      if (polling) {
        setTimeout(pollForNote, POLLING_INTERVAL);
      }
    };

    // Start polling
    timeoutId = setTimeout(() => {
      polling = false;
      setIsPolling(false);
    }, POLLING_TIMEOUT);

    pollForNote();

    return () => {
      polling = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [noteId, claimableNotes, mutate]);

  useEffect(() => {
    if (isNoteFound) {
      navigate('/import-note-success');
    } else if (!isPolling) {
      navigate('/import-note-failure');
    }
  }, [isPolling, isNoteFound, noteId]);

  return (
    <PageLayout pageTitle="Transaction file" showBottomBorder={false} hasBackAction={false}>
      <div className="flex m-auto">
        <div className="flex-1 flex flex-col justify-center items-center md:w-[460px] md:mx-auto">
          <div className="w-40 aspect-square flex items-center justify-center mb-8">
            <Icon name={IconName.InProgress} className="absolute" size="3xl" />
            <CircularProgress borderWeight={2} progress={80} circleColor="black" circleSize={55} spin={true} />
          </div>
          <h1 className="flex flex-col font-semibold text-2xl lh-title text-center text-balance pb-4">
            Verifying transaction
          </h1>
          <p className="text-sm text-center px-4">
            The uploaded transaction file is being processed to verify its details. Please do not refresh or close the
            app.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default ImportNotePending;
