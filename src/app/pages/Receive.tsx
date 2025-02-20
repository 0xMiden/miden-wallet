import React, { useCallback, useRef } from 'react';

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
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import { QueuedTransactionType } from 'lib/miden/types';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { HistoryAction, navigate } from 'lib/woozie';

export interface ReceiveProps {}

const midenClient = await MidenClientInterface.create();

export const Receive: React.FC<ReceiveProps> = () => {
  const account = useAccount();
  const address = account.publicKey;
  const { fieldRef, copy } = useCopyToClipboard();
  const { data: claimableNotes } = useClaimableNotes(address);
  const isDelegatedProvingEnabled = isDelegateProofEnabled();
  const [, queueTransaction] = useQueuedTransactions();
  const fileInputRef = useRef(null);

  const pageTitle = (
    <>
      <T id="receive" />
    </>
  );

  const handleButtonClick = () => {
    // Trigger the hidden input's click event
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        try {
          if (e.target?.result instanceof ArrayBuffer) {
            const noteBytesAsUint8Array = new Uint8Array(e.target.result);

            const noteId = await midenClient.importNoteBytes(noteBytesAsUint8Array);
            await midenClient.syncState();
            navigate(`/import-note-pending/${noteId}`);
          }
        } catch (error) {
          console.error('Error during note import:', error);
          navigate('/import-note-failure');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  const consumeNote = useCallback(
    (noteId: string) => {
      const transaction = {
        type: QueuedTransactionType.ConsumeNoteId,
        data: {
          address: account.publicKey,
          noteId
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
    <PageLayout
      pageTitle={pageTitle}
      showBottomBorder={false}
      step={1}
      setStep={newStep => {
        if (newStep === 0) {
          navigate('/', HistoryAction.Replace);
        }
      }}
      skip={false}
    >
      <div className="p-4">
        <FormField ref={fieldRef} value={address} style={{ display: 'none' }} />
        <div className="flex flex-col justify-start">
          <div className="flex justify-center items-center gap-24 pb-6">
            <div className="flex flex-col">
              <p className="text-xs text-gray-400">Your address</p>
              <p className="text-sm">{address}</p>
            </div>
            <Icon name={IconName.Copy} onClick={copy} style={{ cursor: 'pointer' }} />
          </div>
        </div>
        <div className="w-5/6 md:w-1/2 mx-auto" style={{ borderBottom: '1px solid #E9EBEF' }}></div>
        <div className="flex flex-col justify-center items-center gap-y-2 p-6">
          <p className="text-xs text-gray-400">Already have a transaction file?</p>
          <Button
            className="w-5/6 md:w-1/2"
            variant={ButtonVariant.Secondary}
            onClick={handleButtonClick}
            title="Upload file"
            style={{ cursor: 'pointer' }}
            iconLeft={true ? IconName.File : null}
          />
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
        <div className="w-5/6 md:w-1/2 mx-auto" style={{ borderBottom: '1px solid #E9EBEF' }}></div>
        <div className="flex flex-col gap-y-4 p-6">
          <div className="flex justify-center">
            <div className="relative left-[-33%] md:left-[-19%]">
              {claimableNotes !== undefined && claimableNotes.length > 0 && (
                <p className="text-md text-gray-600">Ready to claim</p>
              )}
            </div>
          </div>
          {claimableNotes !== undefined &&
            claimableNotes.map(note => (
              <div key={note.id} className="flex justify-center items-center gap-8">
                <div className="flex items-center gap-x-2">
                  <Icon name={IconName.ArrowRightDownFilledCircle} size="lg" />
                  <div className="flex flex-col">
                    <p className="text-md font-bold">{`${note.amount} MIDEN`}</p>
                    <p className="text-xs text-gray-600">{note.senderAddress}</p>
                  </div>
                </div>
                <Button
                  className="w-[75px] h-[36px] text-md"
                  variant={ButtonVariant.Primary}
                  onClick={() => consumeNote(note.id)}
                  title="Claim"
                />
              </div>
            ))}
        </div>
      </div>
    </PageLayout>
  );
};
