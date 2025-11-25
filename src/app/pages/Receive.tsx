import React, { useCallback, useRef, useState } from 'react';

import classNames from 'clsx';

import FormField from 'app/atoms/FormField';
import { openLoadingFullPage, useAppEnv } from 'app/env';
import { useMidenClient } from 'app/hooks/useMidenClient';
import { Icon, IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import AddressChip from 'app/templates/AddressChip';
import { Button, ButtonVariant } from 'components/Button';
import { formatBigInt } from 'lib/i18n/numbers';
import { T } from 'lib/i18n/react';
import { initiateConsumeTransaction } from 'lib/miden/activity';
import { useAccount } from 'lib/miden/front';
import { useClaimableNotes } from 'lib/miden/front/claimable-notes';
import { ConsumableNote } from 'lib/miden/types';
import { isDelegateProofEnabled } from 'lib/settings/helpers';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { HistoryAction, navigate } from 'lib/woozie';
import { truncateAddress } from 'utils/string';

export interface ReceiveProps {}

export const Receive: React.FC<ReceiveProps> = () => {
  const account = useAccount();
  const address = account.publicKey;
  const { midenClient } = useMidenClient();
  const { fieldRef, copy } = useCopyToClipboard();
  const { data: claimableNotes, mutate: mutateClaimableNotes } = useClaimableNotes(address);
  const isDelegatedProvingEnabled = isDelegateProofEnabled();
  const { popup } = useAppEnv();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attemptedNoteIds, setAttemptedNoteIds] = useState(new Set<string>());
  const safeClaimableNotes = (claimableNotes ?? []).filter((n): n is NonNullable<typeof n> => n != null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleFileChange = useCallback(
    (file: File) => {
      if (!midenClient) return;

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
    },
    [midenClient]
  );

  const onDropFile = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileChange(file);
        setIsDragging(false);
      }
    },
    [handleFileChange]
  );

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return; // Ignore if the drag is over a childelement
    setIsDragging(false);
  }, []);

  const onUploadFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileChange(file);
      }
    },
    [handleFileChange]
  );

  const consumeNote = useCallback(
    async (note: ConsumableNote) => {
      try {
        await initiateConsumeTransaction(account.publicKey, note, isDelegatedProvingEnabled);
        await mutateClaimableNotes();
        openLoadingFullPage();
        setAttemptedNoteIds(prev => new Set(prev).add(note.id));
      } catch (error) {
        console.error('Error consuming note:', error);
      }
    },
    [account, isDelegatedProvingEnabled, mutateClaimableNotes]
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
      <div
        className="p-4"
        onDrop={onDropFile}
        onDragOver={e => e.preventDefault()}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
      >
        <FormField ref={fieldRef} value={address} style={{ display: 'none' }} />
        <div className="flex flex-col justify-start">
          <div className="flex justify-center items-center gap-24 pb-6">
            <div className="flex flex-col">
              <p className="text-sm md:text-xs text-gray-400 pl-2 md:pl-0">Your address</p>
              {popup ? (
                <AddressChip address={address} trim={false} className="flex items-center text-sm" />
              ) : (
                <p className="text-sm">{address}</p>
              )}
            </div>
            {!popup && <Icon name={IconName.Copy} onClick={copy} style={{ cursor: 'pointer' }} />}
          </div>
        </div>
        <div className="w-5/6 md:w-1/2 mx-auto" style={{ borderBottom: '1px solid #E9EBEF' }}></div>
        <div className="flex flex-col justify-center items-center gap-y-2 p-6">
          <p className="text-xs text-gray-400">Already have a transaction file?</p>
          <Button
            className={classNames('w-5/6 md:w-1/2')}
            variant={isDragging ? ButtonVariant.Primary : ButtonVariant.Secondary}
            onClick={handleButtonClick}
            title="Upload file"
            style={{ cursor: 'pointer' }}
            iconLeft={true ? IconName.File : null}
          />
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={onUploadFile} />
        </div>
        <div className="w-5/6 md:w-1/2 mx-auto" style={{ borderBottom: '1px solid #E9EBEF' }}></div>
        <div className="flex flex-col gap-y-4 p-6">
          <div className="flex justify-center">
            <div className="relative left-[-33%] md:left-[-19%]">
              {claimableNotes !== undefined && claimableNotes.length > 0 && (
                <p className="text-md text-gray-100">Ready to claim</p>
              )}
            </div>
          </div>
          {safeClaimableNotes.map(note => {
            const claimHasFailed = attemptedNoteIds.has(note.id) && !note.isBeingClaimed;
            return (
              <div key={note.id} className="flex justify-center items-center gap-8">
                <div className="flex items-center gap-x-2">
                  <Icon name={IconName.ArrowRightDownFilledCircle} size="lg" />
                  <div className="flex flex-col">
                    <p className="text-md font-bold">
                      {claimHasFailed ? 'Error Claiming: ' : ''}
                      {`${formatBigInt(BigInt(note.amount), note.metadata?.decimals || 6)} ${
                        note.metadata?.symbol || 'UNKNOWN'
                      }`}
                    </p>
                    <p className="text-xs text-gray-100">{truncateAddress(note.senderAddress)}</p>
                  </div>
                </div>
                {note.isBeingClaimed ? (
                  <div className="w-[75px] h-[36px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <Button
                    className="w-[75px] h-[36px] text-md"
                    variant={ButtonVariant.Primary}
                    onClick={() => consumeNote(note)}
                    title={claimHasFailed ? 'Retry' : 'Claim'}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};
