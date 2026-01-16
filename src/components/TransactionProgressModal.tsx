import React, { FC, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';

import CustomModal from 'app/atoms/CustomModal';
import { transactionModalState } from 'lib/mobile/transaction-modal';
import { safeGenerateTransactionsLoop as dbTransactionsLoop, getAllUncompletedTransactions } from 'lib/miden/activity';
import { useMidenContext } from 'lib/miden/front';
import { useRetryableSWR } from 'lib/swr';
import { GeneratingTransaction } from 'screens/generating-transaction/GeneratingTransaction';

export const TransactionProgressModal: FC = () => {
  const [isOpen, setIsOpen] = useState(transactionModalState.isOpen());
  const { signTransaction } = useMidenContext();
  const [error, setError] = useState(false);

  useEffect(() => {
    return transactionModalState.subscribe(setIsOpen);
  }, []);

  const { data: txs, mutate: mutateTx } = useRetryableSWR(
    isOpen ? [`modal-generating-transactions`] : null,
    async () => getAllUncompletedTransactions(),
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
  useEffect(() => {
    if (isOpen && transactions.length === 0 && !error) {
      // Give a brief delay so user sees completion
      const timeoutId = setTimeout(() => {
        transactionModalState.close();
        setError(false);
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, transactions.length, error]);

  const handleClose = useCallback(() => {
    transactionModalState.close();
    setError(false);
  }, []);

  const progress = transactions.length > 0 ? (1 / transactions.length) * 80 : 0;
  const transactionComplete = transactions.length === 0;

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
