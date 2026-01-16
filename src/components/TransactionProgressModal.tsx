import React, { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import classNames from 'clsx';
import Modal from 'react-modal';

import { safeGenerateTransactionsLoop as dbTransactionsLoop, getAllUncompletedTransactions } from 'lib/miden/activity';
import { useMidenContext } from 'lib/miden/front';
import { isMobile } from 'lib/platform';
import { useWalletStore } from 'lib/store';
import { useRetryableSWR } from 'lib/swr';
import { GeneratingTransaction } from 'screens/generating-transaction/GeneratingTransaction';

export const TransactionProgressModal: FC = () => {
  // Use Zustand store for modal state - this is more reliable than custom subscription
  const isOpen = useWalletStore(state => state.isTransactionModalOpen);
  const closeModal = useWalletStore(state => state.closeTransactionModal);

  const { signTransaction } = useMidenContext();
  const [error, setError] = useState(false);
  // Track if we've completed the initial fetch - prevents auto-close race condition
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Reset hasLoadedOnce when modal closes
  useEffect(() => {
    console.log('[TransactionProgressModal] isOpen changed to:', isOpen);
    if (!isOpen) {
      console.log('[TransactionProgressModal] Modal closed, resetting hasLoadedOnce');
      setHasLoadedOnce(false);
    }
  }, [isOpen]);

  // Debug: log every render
  console.log(
    '[TransactionProgressModal] Render, isOpen:',
    isOpen,
    'isMobile:',
    isMobile(),
    'hasLoadedOnce:',
    hasLoadedOnce,
    'error:',
    error
  );

  const { data: txs, mutate: mutateTx } = useRetryableSWR(
    isOpen ? [`modal-generating-transactions`] : null,
    async () => {
      console.log('[TransactionProgressModal] SWR fetcher called, fetching transactions...');
      const txList = await getAllUncompletedTransactions();
      console.log(
        '[TransactionProgressModal] Fetched transactions:',
        txList.length,
        txList.map(t => ({ id: t.id, type: t.type, status: t.status }))
      );
      // Mark that we've loaded at least once
      console.log('[TransactionProgressModal] Setting hasLoadedOnce = true');
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
  console.log('[TransactionProgressModal] transactions array length:', transactions.length, 'txs from SWR:', txs);

  const generateTransaction = useCallback(async () => {
    console.log('[TransactionProgressModal] generateTransaction called, isOpen:', isOpen);
    if (!isOpen) {
      console.log('[TransactionProgressModal] generateTransaction skipped because isOpen=false');
      return;
    }

    try {
      console.log('[TransactionProgressModal] Calling dbTransactionsLoop...');
      const success = await dbTransactionsLoop(signTransaction);
      console.log('[TransactionProgressModal] dbTransactionsLoop returned:', success);
      if (success === false) {
        console.log('[TransactionProgressModal] dbTransactionsLoop returned false, setting error=true');
        setError(true);
      }
      mutateTx();
    } catch (e) {
      console.error('[TransactionProgressModal] Error in generateTransaction:', e);
      setError(true);
    }
  }, [isOpen, mutateTx, signTransaction]);

  useEffect(() => {
    console.log('[TransactionProgressModal] Processing effect, isOpen:', isOpen, 'error:', error);
    if (!isOpen || error) {
      console.log('[TransactionProgressModal] Skipping processing effect');
      return;
    }

    // Start processing immediately
    console.log('[TransactionProgressModal] Starting transaction processing...');
    generateTransaction();

    // Then poll every 10 seconds
    const intervalId = setInterval(() => {
      console.log('[TransactionProgressModal] Polling interval triggered');
      generateTransaction();
    }, 10_000);

    return () => {
      console.log('[TransactionProgressModal] Clearing processing interval');
      clearInterval(intervalId);
    };
  }, [isOpen, generateTransaction, error]);

  // Auto-close when all transactions are done
  // Only auto-close AFTER we've done initial fetch (hasLoadedOnce) to prevent race condition
  useEffect(() => {
    console.log('[TransactionProgressModal] Auto-close effect check:', {
      isOpen,
      hasLoadedOnce,
      transactionsLength: transactions.length,
      error
    });
    if (isOpen && hasLoadedOnce && transactions.length === 0 && !error) {
      console.log('[TransactionProgressModal] >>> AUTO-CLOSE TRIGGERED! All transactions complete, auto-closing in 3s');
      // Give a brief delay so user sees completion
      const timeoutId = setTimeout(() => {
        console.log('[TransactionProgressModal] >>> AUTO-CLOSE TIMEOUT FIRED, closing modal now');
        closeModal();
        setError(false);
      }, 3000);
      return () => {
        console.log('[TransactionProgressModal] >>> AUTO-CLOSE TIMEOUT CLEARED');
        clearTimeout(timeoutId);
      };
    }
  }, [isOpen, hasLoadedOnce, transactions.length, error, closeModal]);

  const handleClose = useCallback(() => {
    console.log('[TransactionProgressModal] handleClose called');
    closeModal();
    setError(false);
  }, [closeModal]);

  const progress = transactions.length > 0 ? (1 / transactions.length) * 80 : 0;
  // Only show complete if we've loaded AND there are no transactions
  const transactionComplete = hasLoadedOnce && transactions.length === 0;

  console.log(
    '[TransactionProgressModal] RENDER isOpen=' +
      isOpen +
      ' hasLoadedOnce=' +
      hasLoadedOnce +
      ' txCount=' +
      transactions.length +
      ' isMobile=' +
      isMobile()
  );

  // Only render on mobile - desktop uses separate tab for transaction progress
  if (!isMobile()) {
    return null;
  }

  if (!isOpen) {
    console.log('[TransactionProgressModal] NOT rendering modal because isOpen=false');
    return null;
  }

  console.log('[TransactionProgressModal] RENDERING MODAL NOW');

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
      className={classNames(
        'bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 outline-none'
      )}
      overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-6"
      style={{
        overlay: { zIndex: 9999 },
        content: { zIndex: 9999 }
      }}
      appElement={modalRoot}
      parentSelector={() => modalRoot!}
      ariaHideApp={false}
    >
        <GeneratingTransaction
          progress={progress}
          onDoneClick={handleClose}
          transactionComplete={transactionComplete}
          error={error}
        />
      </Modal>,
    modalRoot
  );
};
