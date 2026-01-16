import React, { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';

import CustomModal from 'app/atoms/CustomModal';
import { safeGenerateTransactionsLoop as dbTransactionsLoop, getAllUncompletedTransactions } from 'lib/miden/activity';
import { useMidenContext } from 'lib/miden/front';
import { transactionModalState } from 'lib/mobile/transaction-modal';
import { useRetryableSWR } from 'lib/swr';
import { GeneratingTransaction } from 'screens/generating-transaction/GeneratingTransaction';

export const TransactionProgressModal: FC = () => {
  const [isOpen, setIsOpen] = useState(() => {
    const initialState = transactionModalState.isOpen();
    console.log('[TransactionProgressModal] Initial isOpen state:', initialState);
    return initialState;
  });
  const { signTransaction } = useMidenContext();
  const [error, setError] = useState(false);
  // Track if we've completed the initial fetch - prevents auto-close race condition
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Debug: log every render
  console.log('[TransactionProgressModal] Render, isOpen:', isOpen);

  useEffect(() => {
    console.log('[TransactionProgressModal] Component mounted, subscribing...');
    const unsubscribe = transactionModalState.subscribe(open => {
      console.log('[TransactionProgressModal] Modal state changed:', open);
      setIsOpen(open);
      // Reset hasLoadedOnce when modal closes so next open starts fresh
      if (!open) {
        setHasLoadedOnce(false);
      }
    });
    console.log('[TransactionProgressModal] Subscribed successfully');
    return unsubscribe;
  }, []);

  const { data: txs, mutate: mutateTx } = useRetryableSWR(
    isOpen ? [`modal-generating-transactions`] : null,
    async () => {
      const txList = await getAllUncompletedTransactions();
      console.log(
        '[TransactionProgressModal] Fetched transactions:',
        txList.length,
        txList.map(t => ({ id: t.id, type: t.type, status: t.status }))
      );
      // Mark that we've loaded at least once
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
    if (!isOpen) return;

    try {
      console.log('[TransactionProgressModal] Calling dbTransactionsLoop...');
      const success = await dbTransactionsLoop(signTransaction);
      console.log('[TransactionProgressModal] dbTransactionsLoop returned:', success);
      if (success === false) {
        setError(true);
      }
      mutateTx();
    } catch (e) {
      console.error('[TransactionProgressModal] Error:', e);
      setError(true);
    }
  }, [isOpen, mutateTx, signTransaction]);

  useEffect(() => {
    if (!isOpen || error) return;

    // Start processing immediately
    generateTransaction();

    // Then poll every 10 seconds
    const intervalId = setInterval(() => {
      generateTransaction();
    }, 10_000);

    return () => clearInterval(intervalId);
  }, [isOpen, generateTransaction, error]);

  // Auto-close when all transactions are done
  // Only auto-close AFTER we've done initial fetch (hasLoadedOnce) to prevent race condition
  useEffect(() => {
    if (isOpen && hasLoadedOnce && transactions.length === 0 && !error) {
      console.log('[TransactionProgressModal] All transactions complete, auto-closing in 3s');
      // Give a brief delay so user sees completion
      const timeoutId = setTimeout(() => {
        transactionModalState.close();
        setError(false);
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, hasLoadedOnce, transactions.length, error]);

  const handleClose = useCallback(() => {
    transactionModalState.close();
    setError(false);
  }, []);

  const progress = transactions.length > 0 ? (1 / transactions.length) * 80 : 0;
  // Only show complete if we've loaded AND there are no transactions
  const transactionComplete = hasLoadedOnce && transactions.length === 0;

  console.log(
    '[TransactionProgressModal] RENDER isOpen=' +
      isOpen +
      ' hasLoadedOnce=' +
      hasLoadedOnce +
      ' txCount=' +
      transactions.length
  );

  if (!isOpen) {
    console.log('[TransactionProgressModal] NOT rendering modal because isOpen=false');
    return null;
  }

  console.log('[TransactionProgressModal] RENDERING MODAL NOW');

  return (
    <CustomModal
      isOpen={isOpen}
      onRequestClose={handleClose}
      shouldCloseOnOverlayClick={transactionComplete || error}
      className={classNames('w-full max-w-md mx-4 p-6 rounded-2xl')}
    >
      <GeneratingTransaction
        progress={progress}
        onDoneClick={handleClose}
        transactionComplete={transactionComplete}
        error={error}
      />
    </CustomModal>
  );
};
