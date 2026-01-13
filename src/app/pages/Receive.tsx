import React, { useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
  const [isClaimingAll, setIsClaimingAll] = useState(false);
  const [claimingNoteIds, setClaimingNoteIds] = useState<Set<string>>(new Set());
  const claimAllAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      claimAllAbortRef.current?.abort();
    };
  }, []);

  const handleClaimAll = useCallback(async () => {
    if (safeClaimableNotes.length === 0) return;

    setIsClaimingAll(true);
    claimAllAbortRef.current?.abort();
    claimAllAbortRef.current = new AbortController();
    const signal = claimAllAbortRef.current.signal;

    // Mark all notes as being claimed
    const noteIds = safeClaimableNotes.filter(n => !n.isBeingClaimed).map(n => n.id);
    setClaimingNoteIds(new Set(noteIds));

    try {
      // Queue all transactions first, before opening loading page
      // This ensures all notes get queued even if the popup closes
      const transactionIds: { noteId: string; txId: string }[] = [];
      for (const note of safeClaimableNotes) {
        if (note.isBeingClaimed) continue;
        try {
          const id = await initiateConsumeTransaction(account.publicKey, note, isDelegatedProvingEnabled);
          transactionIds.push({ noteId: note.id, txId: id });
        } catch (err) {
          console.error('Error queuing note for claim:', note.id, err);
          // Remove from claiming set if failed to queue
          setClaimingNoteIds(prev => {
            const next = new Set(prev);
            next.delete(note.id);
            return next;
          });
        }
      }

      // Open loading page (popup stays open since tab is not active)
      await openLoadingFullPage();

      // Wait for all transactions to complete
      for (const { txId } of transactionIds) {
        if (signal.aborted) break;
        try {
          await waitForConsumeTx(txId, signal);
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            break;
          }
          console.error('Error waiting for transaction:', txId, err);
        }
        // Note: Don't remove from claimingNoteIds here - keep spinner visible
        // until mutateClaimableNotes() refreshes the list and removes the note
      }

      // Refresh the list - this will remove successfully claimed notes
      await mutateClaimableNotes();
    } finally {
      setIsClaimingAll(false);
      setClaimingNoteIds(new Set());
    }
  }, [safeClaimableNotes, account.publicKey, isDelegatedProvingEnabled, mutateClaimableNotes]);

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
      titleContainerClassName="w-5/6 md:w-1/2 mx-auto"
      step={1}
      setStep={newStep => {
        if (newStep === 0) {
          navigate('/', HistoryAction.Replace);
        }
      }}
      skip={false}
    >
      <div
        onDrop={onDropFile}
        onDragOver={e => e.preventDefault()}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        data-testid="receive-page"
      >
        <FormField ref={fieldRef} value={address} style={{ display: 'none' }} />
        <div className="w-5/6 md:w-1/2 mx-auto pb-6 flex flex-col gap-y-2">
          <p className="text-sm md:text-xs text-gray-400">Your address</p>
          <div className="flex items-center justify-between">
            {popup ? (
              <AddressChip address={address} trim={false} className="flex items-center text-sm" />
            ) : (
              <p className="text-sm">{address}</p>
            )}
            {!popup && <Icon name={IconName.Copy} onClick={copy} style={{ cursor: 'pointer' }} />}
          </div>
        </div>
        <div className="w-5/6 md:w-1/2 mx-auto" style={{ borderBottom: '1px solid #E9EBEF' }}></div>
        <div className="flex flex-col justify-center items-center gap-y-2 p-6">
          <p className="text-xs text-gray-400">{t('alreadyHaveTransactionFile')}</p>
          <Button
            className={classNames('w-5/6 md:w-1/2')}
            variant={isDragging ? ButtonVariant.Primary : ButtonVariant.Secondary}
            onClick={handleButtonClick}
            title={t('uploadFile')}
            style={{ cursor: 'pointer' }}
            iconLeft={true ? IconName.File : null}
          />
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={onUploadFile} />
        </div>
        <div className="w-5/6 md:w-1/2 mx-auto" style={{ borderBottom: '1px solid #E9EBEF' }}></div>
        <div className="w-5/6 md:w-1/2 mx-auto py-6">
          {claimableNotes !== undefined && claimableNotes.length > 0 && (
            <p className="text-md text-gray-600 mb-4">{t('readyToClaim')}</p>
          )}
          {/* Scrollable notes container */}
          <div
            className="flex flex-col gap-y-4 overflow-y-auto"
            style={{ maxHeight: '160px', scrollbarGutter: 'stable' }}
          >
            {safeClaimableNotes.map(note => (
              <ConsumableNoteComponent
                key={note.id}
                note={note}
                mutateClaimableNotes={mutateClaimableNotes}
                account={account}
                isDelegatedProvingEnabled={isDelegatedProvingEnabled}
                isClaimingFromParent={claimingNoteIds.has(note.id)}
              />
            ))}
          </div>
          {safeClaimableNotes.length > 0 && (
            <div className="flex justify-center mt-4">
              <Button
                className="w-[120px] h-[40px] text-md"
                variant={ButtonVariant.Primary}
                onClick={handleClaimAll}
                title={t('claimAll')}
                disabled={isClaimingAll}
              />
            </div>
          )}
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
  isClaimingFromParent?: boolean;
}

export const ConsumableNoteComponent = ({
  note,
  mutateClaimableNotes,
  account,
  isDelegatedProvingEnabled,
  isClaimingFromParent = false
}: ConsumableNoteProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(note.isBeingClaimed || false);
  const showSpinner = isLoading || isClaimingFromParent;
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
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-x-2 flex-1 min-w-0">
        <Icon name={IconName.ArrowRightDownFilledCircle} size="lg" />
        <div className="flex flex-col min-w-0">
          <p className="text-md font-bold truncate">
            {error ? 'Error Claiming: ' : ''}
            {`${formatBigInt(BigInt(note.amount), note.metadata?.decimals || 6)} ${note.metadata?.symbol || 'UNKNOWN'}`}
          </p>
          <p className="text-xs text-gray-500">{truncateAddress(note.senderAddress)}</p>
        </div>
      </div>
      <div className="flex-shrink-0 ml-4">
        {showSpinner ? (
          <div className="w-[75px] h-[36px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <Button
            className="w-[75px] h-[36px] text-md"
            variant={ButtonVariant.Primary}
            onClick={handleConsume}
            title={error ? t('retry') : t('claim')}
          />
        )}
      </div>
    </div>
  );
};
