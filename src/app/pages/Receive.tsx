import React, { useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import FormField from 'app/atoms/FormField';
import { openLoadingFullPage, useAppEnv } from 'app/env';
import { Icon, IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import { Button, ButtonVariant } from 'components/Button';
import { CardItem } from 'components/CardItem';
import { QRCode } from 'components/QRCode';
import { SyncWaveBackground } from 'components/SyncWaveBackground';
import { formatBigInt } from 'lib/i18n/numbers';
import {
  getUncompletedTransactions,
  initiateConsumeTransaction,
  verifyStuckTransactionsFromNode,
  waitForConsumeTx
} from 'lib/miden/activity';
import { AssetMetadata, useAccount } from 'lib/miden/front';
import { useClaimableNotes } from 'lib/miden/front/claimable-notes';
import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';
import { ConsumableNote } from 'lib/miden/types';
import { hapticLight } from 'lib/mobile/haptics';
import { isMobile } from 'lib/platform';
import { isDelegateProofEnabled } from 'lib/settings/helpers';
import { WalletAccount } from 'lib/shared/types';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { goBack, HistoryAction, navigate, useLocation } from 'lib/woozie';
import { truncateAddress } from 'utils/string';

export interface ReceiveProps {}

export const Receive: React.FC<ReceiveProps> = () => {
  const { t } = useTranslation();
  const { search } = useLocation();
  const account = useAccount();
  const address = account.publicKey;

  // Check if opened from notification (should go back instead of home on close)
  const fromNotification = new URLSearchParams(search).get('fromNotification') === 'true';
  const { fieldRef, copy, copied } = useCopyToClipboard();
  const { data: claimableNotes, mutate: mutateClaimableNotes } = useClaimableNotes(address);
  const isDelegatedProvingEnabled = isDelegateProofEnabled();
  const { popup } = useAppEnv();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const safeClaimableNotes = (claimableNotes ?? []).filter((n): n is NonNullable<typeof n> => n != null);
  const [isDragging, setIsDragging] = useState(false);
  const [claimingNoteIds, setClaimingNoteIds] = useState<Set<string>>(new Set());
  // Track individual note claiming states reported by child components
  const [individualClaimingIds, setIndividualClaimingIds] = useState<Set<string>>(new Set());
  // Track notes that failed during Claim All
  const [failedNoteIds, setFailedNoteIds] = useState<Set<string>>(new Set());
  const claimAllAbortRef = useRef<AbortController | null>(null);

  // Callback for child components to report their claiming state
  const handleClaimingStateChange = useCallback((noteId: string, isClaiming: boolean) => {
    setIndividualClaimingIds(prev => {
      const next = new Set(prev);
      if (isClaiming) {
        next.add(noteId);
      } else {
        next.delete(noteId);
      }
      return next;
    });
  }, []);

  // Notes that are not currently being claimed (available for "Claim All")
  // A note is claimable if it's not being claimed via:
  // - IndexedDB (isBeingClaimed) - from previous sessions or after tx queued
  // - Claim All operation (claimingNoteIds) - current batch operation
  // - Individual claim (individualClaimingIds) - user clicked single Claim button
  const unclaimedNotes = safeClaimableNotes.filter(
    n => !n.isBeingClaimed && !claimingNoteIds.has(n.id) && !individualClaimingIds.has(n.id)
  );

  useEffect(() => {
    return () => {
      claimAllAbortRef.current?.abort();
    };
  }, []);

  // Poll for stuck transactions and verify their state from the node
  useEffect(() => {
    const checkStuckTransactions = async () => {
      const resolved = await verifyStuckTransactionsFromNode();
      if (resolved > 0) {
        // Refresh claimable notes if any transactions were resolved
        mutateClaimableNotes();
      }
    };

    // Check immediately on mount
    checkStuckTransactions();

    // Then poll every 3 seconds
    const interval = setInterval(checkStuckTransactions, 3000);
    return () => clearInterval(interval);
  }, [mutateClaimableNotes]);

  const handleClaimAll = useCallback(async () => {
    if (unclaimedNotes.length === 0) return;

    claimAllAbortRef.current?.abort();
    claimAllAbortRef.current = new AbortController();
    const signal = claimAllAbortRef.current.signal;

    // Refresh the claimable notes list before queueing to avoid race conditions
    // with auto-consume (Explore page may have already started claiming some notes)
    const freshNotes = await mutateClaimableNotes();
    const freshUnclaimedNotes = (freshNotes ?? []).filter(
      n => n && !n.isBeingClaimed && !claimingNoteIds.has(n.id) && !individualClaimingIds.has(n.id)
    );

    if (freshUnclaimedNotes.length === 0) {
      // All notes are already being claimed (likely by auto-consume)
      return;
    }

    // Mark unclaimed notes as being claimed
    const noteIds = freshUnclaimedNotes.map(n => n!.id);
    setClaimingNoteIds(new Set(noteIds));

    // Track results
    let succeeded = 0;
    let failed = 0;
    let queueFailed = 0;

    // Clear previous failures
    setFailedNoteIds(new Set());

    try {
      // Queue all transactions first, before opening loading page
      // This ensures all notes get queued even if the popup closes
      const transactionIds: { noteId: string; txId: string }[] = [];
      for (const note of freshUnclaimedNotes) {
        try {
          const id = await initiateConsumeTransaction(account.publicKey, note, isDelegatedProvingEnabled);
          transactionIds.push({ noteId: note.id, txId: id });
        } catch (err) {
          console.error('Error queuing note for claim:', note.id, err);
          queueFailed++;
          // Mark as failed and remove from claiming set
          setFailedNoteIds(prev => new Set(prev).add(note.id));
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
      for (const { noteId, txId } of transactionIds) {
        if (signal.aborted) break;
        try {
          await waitForConsumeTx(txId, signal);
          succeeded++;
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') {
            break;
          }
          console.error('Error waiting for transaction:', txId, err);
          failed++;
          // Mark this note as failed
          setFailedNoteIds(prev => new Set(prev).add(noteId));
        }
        // Note: Don't remove from claimingNoteIds here - keep spinner visible
        // until mutateClaimableNotes() refreshes the list and removes the note
      }

      // Refresh the list - this will remove successfully claimed notes
      await mutateClaimableNotes();

      // Navigate to home on mobile after claiming all notes (only if all succeeded)
      failed += queueFailed;
      if (isMobile() && failed === 0) {
        navigate('/', HistoryAction.Replace);
      }
    } finally {
      setClaimingNoteIds(new Set());
    }
  }, [
    unclaimedNotes,
    account.publicKey,
    isDelegatedProvingEnabled,
    mutateClaimableNotes,
    claimingNoteIds,
    individualClaimingIds
  ]);

  const pageTitle = <>{t('receive')}</>;

  const handleButtonClick = () => {
    // Trigger the hidden input's click event
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        if (e.target?.result instanceof ArrayBuffer) {
          const noteBytesAsUint8Array = new Uint8Array(e.target.result);

          // Wrap WASM client operations in a lock to prevent concurrent access
          const noteId = await withWasmClientLock(async () => {
            const midenClient = await getMidenClient();
            const id = await midenClient.importNoteBytes(noteBytesAsUint8Array);
            await midenClient.syncState();
            return id;
          });
          navigate(`/import-note-pending/${noteId}`);
        }
      } catch (error) {
        console.error('Error during note import:', error);
        navigate('/import-note-failure');
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

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
          if (fromNotification) {
            // Go back to where user was before tapping notification
            goBack();
          } else {
            navigate('/', HistoryAction.Replace);
          }
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
        <div className="w-5/6 md:w-1/2 mx-auto pb-4 flex flex-col items-center">
          <QRCode address={address} size={80} onCopy={copy} className="w-full" />
          {copied && <p className="text-xs text-primary-500 mt-1 transition-opacity duration-200">{t('copied')}</p>}
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
        <div className="w-5/6 md:w-1/2 mx-auto py-6 flex flex-col">
          {safeClaimableNotes.length === 0 ? (
            <div className="flex flex-col items-center pt-20">
              <Icon name={IconName.Coins} size="xl" className="mb-3 text-gray-600" />
              <p className="text-sm text-center text-gray-600">{t('noNotesToClaim')}</p>
            </div>
          ) : (
            <>
              <p className="text-md text-gray-600 mb-4">{t('readyToClaim', { count: safeClaimableNotes.length })}</p>
              {/* Scrollable notes container */}
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[28vh]">
                {safeClaimableNotes.map(note => (
                  <ConsumableNoteComponent
                    key={note.id}
                    note={note}
                    mutateClaimableNotes={mutateClaimableNotes}
                    account={account}
                    isDelegatedProvingEnabled={isDelegatedProvingEnabled}
                    isClaimingFromParent={claimingNoteIds.has(note.id)}
                    hasFailedFromParent={failedNoteIds.has(note.id)}
                    onClaimingStateChange={handleClaimingStateChange}
                  />
                ))}
              </div>
            </>
          )}
          {unclaimedNotes.length > 0 && (
            <div className="flex justify-center mt-8 pb-4">
              <Button
                className="w-[120px] h-[40px] text-md"
                variant={ButtonVariant.Primary}
                onClick={handleClaimAll}
                title={t('claimAll')}
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
  hasFailedFromParent?: boolean;
  onClaimingStateChange?: (noteId: string, isClaiming: boolean) => void;
}

export const ConsumableNoteComponent = ({
  note,
  mutateClaimableNotes,
  account,
  isDelegatedProvingEnabled,
  isClaimingFromParent = false,
  hasFailedFromParent = false,
  onClaimingStateChange
}: ConsumableNoteProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(note.isBeingClaimed || false);
  const showSpinner = isLoading || isClaimingFromParent;
  const [error, setError] = useState<string | null>(null);
  const hasError = error || hasFailedFromParent;
  const abortControllerRef = useRef<AbortController | null>(null);
  // Track if we've verified the claim status to prevent sync effect from re-enabling loading
  const hasVerifiedClaimStatus = useRef(false);

  // Report claiming state changes to parent
  useEffect(() => {
    onClaimingStateChange?.(note.id, isLoading);
  }, [isLoading, note.id, onClaimingStateChange]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Sync isLoading state when note.isBeingClaimed changes (e.g., popup reopened with in-progress claim)
  // Skip if we've already verified the claim status (e.g., found no transaction in IndexedDB)
  useEffect(() => {
    if (note.isBeingClaimed && !isLoading && !hasVerifiedClaimStatus.current) {
      setIsLoading(true);
    }
  }, [note.isBeingClaimed, isLoading]);

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
        hasVerifiedClaimStatus.current = true;
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
        hasVerifiedClaimStatus.current = true;
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
      const remainingNotes = await mutateClaimableNotes();
      console.log('Successfully consumed note, tx hash:', txHash);

      // Navigate to home on mobile if no more notes to claim
      if (isMobile() && (!remainingNotes || remainingNotes.length === 0)) {
        navigate('/', HistoryAction.Replace);
      }
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
  const amountText = `${formatBigInt(BigInt(note.amount), note.metadata?.decimals || 6)} ${note.metadata?.symbol || 'UNKNOWN'}`;

  return (
    <div className="relative flex">
      <SyncWaveBackground isSyncing={showSpinner} className="rounded-lg" />
      <CardItem
        iconLeft={<Icon name={IconName.ArrowRightDownFilledCircle} size="lg" />}
        title={hasError ? t('errorClaiming') : amountText}
        subtitle={truncateAddress(note.senderAddress)}
        iconRight={
          !showSpinner ? (
            <Button
              className="w-[75px] h-[36px] text-md"
              variant={ButtonVariant.Primary}
              onClick={handleConsume}
              title={hasError ? t('retry') : t('claim')}
            />
          ) : undefined
        }
        className="flex-1 border border-grey-50 rounded-lg"
      />
    </div>
  );
};
