import React, { useCallback, useEffect, useRef, useState } from 'react';

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
import { getUncompletedTransactions, initiateConsumeTransaction, waitForConsumeTx } from 'lib/miden/activity';
import { AssetMetadata, useAccount } from 'lib/miden/front';
import { useClaimableNotes } from 'lib/miden/front/claimable-notes';
import { ConsumableNote } from 'lib/miden/types';
import { isDelegateProofEnabled } from 'lib/settings/helpers';
import { WalletAccount } from 'lib/shared/types';
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
        data-testid="receive-page"
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
          {safeClaimableNotes.map(note => (
            <ConsumableNoteComponent
              key={note.id}
              note={note}
              mutateClaimableNotes={mutateClaimableNotes}
              account={account}
              isDelegatedProvingEnabled={isDelegatedProvingEnabled}
            />
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

interface ConsumableNoteProps {
  account: WalletAccount;
  note: NonNullable<ConsumableNote & { metadata: AssetMetadata }>;
  mutateClaimableNotes: ReturnType<typeof useClaimableNotes>['mutate'];
  isDelegatedProvingEnabled: boolean;
}

export const ConsumableNoteComponent = ({
  note,
  mutateClaimableNotes,
  account,
  isDelegatedProvingEnabled
}: ConsumableNoteProps) => {
  const [isLoading, setIsLoading] = useState(note.isBeingClaimed || false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Resume waiting for in-progress transaction when component mounts with isBeingClaimed
  useEffect(() => {
    if (!note.isBeingClaimed || abortControllerRef.current) {
      return;
    }

    const resumeWaiting = async () => {
      const uncompletedTxs = await getUncompletedTransactions(account.publicKey);
      const tx = uncompletedTxs.find(t => t.type === 'consume' && t.noteId === note.id);

      if (!tx) {
        // Transaction not found - it may have completed/failed already
        setIsLoading(false);
        return;
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        const txHash = await waitForConsumeTx(tx.id, signal);
        await mutateClaimableNotes();
        console.log('Successfully consumed note (resumed), tx hash:', txHash);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError('Failed to consume note. Please try again.');
        console.error('Error consuming note (resumed):', err);
      } finally {
        setIsLoading(false);
      }
    };

    resumeWaiting();
  }, [note.isBeingClaimed, note.id, account.publicKey, mutateClaimableNotes]);

  const handleConsume = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const id = await initiateConsumeTransaction(account.publicKey, note, isDelegatedProvingEnabled);
      await openLoadingFullPage();
      const txHash = await waitForConsumeTx(id, signal);
      await mutateClaimableNotes();
      console.log('Successfully consumed note, tx hash:', txHash);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setError('Failed to consume note. Please try again.');
      console.error('Error consuming note:', error);
    } finally {
      setIsLoading(false);
    }
  }, [account, isDelegatedProvingEnabled, mutateClaimableNotes, note]);
  return (
    <div className="flex justify-center items-center gap-8">
      <div className="flex items-center gap-x-2">
        <Icon name={IconName.ArrowRightDownFilledCircle} size="lg" />
        <div className="flex flex-col">
          <p className="text-md font-bold">
            {error ? 'Error Claiming: ' : ''}
            {`${formatBigInt(BigInt(note.amount), note.metadata?.decimals || 6)} ${note.metadata?.symbol || 'UNKNOWN'}`}
          </p>
          <p className="text-xs text-gray-100">{truncateAddress(note.senderAddress)}</p>
        </div>
      </div>
      {isLoading ? (
        <div className="w-[75px] h-[36px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Button
          className="w-[75px] h-[36px] text-md"
          variant={ButtonVariant.Primary}
          onClick={handleConsume}
          title={error ? 'Retry' : 'Claim'}
        />
      )}
    </div>
  );
};
