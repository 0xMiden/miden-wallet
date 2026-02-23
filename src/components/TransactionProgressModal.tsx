import React, { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import Modal from 'react-modal';

import {
  hasQueuedTransactions,
  safeGenerateTransactionsLoop as dbTransactionsLoop,
  getAllUncompletedTransactions
} from 'lib/miden/activity';
import { useMidenContext } from 'lib/miden/front';
import { useWalletStore } from 'lib/store';
import { useRetryableSWR } from 'lib/swr';
import { GeneratingTransaction } from 'screens/generating-transaction/GeneratingTransaction';

export const TransactionProgressModal: FC = () => {
  const { t } = useTranslation();
  // Use Zustand store for modal state
  const isOpen = useWalletStore(state => state.isTransactionModalOpen);
  const openModal = useWalletStore(state => state.openTransactionModal);
  const closeModal = useWalletStore(state => state.closeTransactionModal);

  const { signTransaction } = useMidenContext();
  const [error, setError] = useState(false);
  // Track if we've completed the initial fetch - prevents auto-close race condition
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  // Track if we're actively processing (started when modal opens, continues even when hidden)
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset hasLoadedOnce when modal closes
  useEffect(() => {
    if (!isOpen) {
      setHasLoadedOnce(false);
    }
  }, [isOpen]);

  const { data: txs, mutate: mutateTx } = useRetryableSWR(
    isOpen ? [`modal-generating-transactions`] : null,
    async () => {
      const txList = await getAllUncompletedTransactions();
      setHasLoadedOnce(true);
      return txList;
    },
    {
      revalidateOnMount: true,
      refreshInterval: 5_000,
      dedupingInterval: 3_000
    }
  );

  const transactions = txs || [];

  // Process transactions - continues even when modal is hidden
  const generateTransaction = useCallback(async () => {
    try {
      const success = await dbTransactionsLoop(signTransaction);
      if (success === false) {
        setError(true);
        // Re-open modal to show error if it was hidden
        openModal();
      }
      mutateTx();
    } catch (e) {
      console.error('[TransactionProgressModal] Error in generateTransaction:', e);
      setError(true);
      // Re-open modal to show error if it was hidden
      openModal();
    }
  }, [mutateTx, signTransaction, openModal]);

  // Start processing when modal opens
  useEffect(() => {
    if (isOpen && !isProcessing) {
      setIsProcessing(true);
    }
  }, [isOpen, isProcessing]);

  // Processing loop - runs while processing, regardless of modal visibility
  useEffect(() => {
    if (!isProcessing || error) {
      return;
    }

    // Check if we still have transactions to process
    const checkAndProcess = async () => {
      const hasQueued = await hasQueuedTransactions();
      if (!hasQueued) {
        // No more transactions - stop processing
        setIsProcessing(false);
        return;
      }
      await generateTransaction();
    };

    // Start processing immediately
    checkAndProcess();

    // Then poll every 10 seconds
    const intervalId = setInterval(checkAndProcess, 10_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isProcessing, generateTransaction, error]);

  // Auto-close when all transactions are done
  // Only auto-close AFTER we've done initial fetch (hasLoadedOnce) to prevent race condition
  useEffect(() => {
    if (isOpen && hasLoadedOnce && transactions.length === 0 && !error) {
      // Give a brief delay so user sees completion
      const timeoutId = setTimeout(() => {
        closeModal();
        setError(false);
      }, 3000);
      return () => {
        clearTimeout(timeoutId);
      };
    }
    return undefined;
  }, [isOpen, hasLoadedOnce, transactions.length, error, closeModal]);

  const handleClose = useCallback(() => {
    // Pass true to indicate user explicitly dismissed (prevents auto-reopen)
    closeModal(true);
    setError(false);
  }, [closeModal]);

  const progress = transactions.length > 0 ? (1 / transactions.length) * 80 : 0;
  // Only show complete if we've loaded AND there are no transactions
  const transactionComplete = hasLoadedOnce && transactions.length === 0;

  if (!isOpen) {
    return null;
  }

  // Get or create a dedicated container for this modal
  let modalRoot = document.getElementById('transaction-modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'transaction-modal-root';
    document.body.appendChild(modalRoot);
  }

  // Use portal to render modal in dedicated container, avoiding conflicts with other modals
  return createPortal(
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      shouldCloseOnOverlayClick={transactionComplete || error}
      className={classNames('w-full max-w-lg outline-none flex flex-col items-stretch gap-6')}
      overlayClassName="fixed inset-0 bg-white/10 backdrop-blur-xl backdrop-saturate-150 flex items-center justify-center px-4"
      style={{
        overlay: { zIndex: 9999 },
        content: { position: 'relative', inset: 'unset', zIndex: 9999 }
      }}
      appElement={modalRoot}
      parentSelector={() => modalRoot!}
      ariaHideApp={false}
    >
      <div className="bg-white rounded-10 overflow-hidden">
        <GeneratingTransaction
          progress={progress}
          onDoneClick={handleClose}
          transactionComplete={transactionComplete}
          hasErrors={error}
        />
      </div>
      <button
        className="w-full rounded-2xl bg-primary-500 text-white font-semibold text-base h-12"
        onClick={handleClose}
      >
        {transactionComplete ? t('done') : t('hide')}
      </button>
    </Modal>,
    modalRoot
  );
};
