import React, { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';
import { createPortal } from 'react-dom';
import Modal from 'react-modal';

import { safeGenerateTransactionsLoop as dbTransactionsLoop, getAllUncompletedTransactions } from 'lib/miden/activity';
import { useMidenContext } from 'lib/miden/front';
import { useWalletStore } from 'lib/store';
import { useRetryableSWR } from 'lib/swr';
import { GeneratingTransaction } from 'screens/generating-transaction/GeneratingTransaction';

export const TransactionProgressModal: FC = () => {
  // Use Zustand store for modal state
  const isOpen = useWalletStore(state => state.isTransactionModalOpen);
  const closeModal = useWalletStore(state => state.closeTransactionModal);

  const { signTransaction } = useMidenContext();
  const [error, setError] = useState(false);
  // Track if we've completed the initial fetch - prevents auto-close race condition
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

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

  const generateTransaction = useCallback(async () => {
    if (!isOpen) {
      return;
    }

    try {
      const success = await dbTransactionsLoop(signTransaction);
      if (success === false) {
        setError(true);
      }
      mutateTx();
    } catch (e) {
      console.error('[TransactionProgressModal] Error in generateTransaction:', e);
      setError(true);
    }
  }, [isOpen, mutateTx, signTransaction]);

  useEffect(() => {
    if (!isOpen || error) {
      return;
    }

    // Start processing immediately
    generateTransaction();

    // Then poll every 10 seconds
    const intervalId = setInterval(() => {
      generateTransaction();
    }, 10_000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen, generateTransaction, error]);

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
    closeModal();
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
      className={classNames('bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 outline-none overflow-hidden')}
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
        hasErrors={error}
      />
    </Modal>,
    modalRoot
  );
};
