import { ITransactionStatus, SendTransaction, ConsumeTransaction, Transaction } from '../db/types';

// Set up mocks before importing the module
const mockTransactionsFilter = jest.fn();
const mockTransactionsWhere = jest.fn();
const mockTransactionsAdd = jest.fn();

jest.mock('lib/miden/repo', () => ({
  transactions: {
    filter: mockTransactionsFilter,
    where: mockTransactionsWhere,
    add: mockTransactionsAdd
  }
}));

jest.mock('../sdk/miden-client', () => ({
  getMidenClient: jest.fn()
}));

jest.mock('./notes', () => ({
  importAllNotes: jest.fn(),
  queueNoteImport: jest.fn(),
  registerOutputNote: jest.fn()
}));

jest.mock('lib/miden-worker/consumeNoteId', () => ({
  consumeNoteId: jest.fn()
}));

jest.mock('lib/miden-worker/sendTransaction', () => ({
  sendTransaction: jest.fn()
}));

jest.mock('lib/miden-worker/submitTransaction', () => ({
  submitTransaction: jest.fn()
}));

// Import after mocks are set up
import {
  hasQueuedTransactions,
  getUncompletedTransactions,
  getTransactionsInProgress,
  getAllUncompletedTransactions,
  getFailedTransactions,
  getCompletedTransactions,
  getTransactionById,
  cancelTransactionById,
  MAX_WAIT_BEFORE_CANCEL
} from './transactions';

describe('transactions utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasQueuedTransactions', () => {
    it('returns true when queued transactions exist', async () => {
      mockTransactionsFilter.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce([{ id: 'tx-1', status: ITransactionStatus.Queued }])
      });

      const result = await hasQueuedTransactions();

      expect(result).toBe(true);
    });

    it('returns false when no queued transactions', async () => {
      mockTransactionsFilter.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce([])
      });

      const result = await hasQueuedTransactions();

      expect(result).toBe(false);
    });
  });

  describe('getTransactionsInProgress', () => {
    it('returns transactions in GeneratingTransaction status sorted by initiatedAt', async () => {
      const tx1 = { id: 'tx-1', status: ITransactionStatus.GeneratingTransaction, initiatedAt: 200 };
      const tx2 = { id: 'tx-2', status: ITransactionStatus.GeneratingTransaction, initiatedAt: 100 };
      mockTransactionsFilter.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce([tx1, tx2])
      });

      const result = await getTransactionsInProgress();

      expect(result[0].id).toBe('tx-2'); // Earlier initiatedAt first
      expect(result[1].id).toBe('tx-1');
    });
  });

  describe('getAllUncompletedTransactions', () => {
    it('returns queued and generating transactions', async () => {
      const txs = [
        { id: 'tx-1', status: ITransactionStatus.Queued, initiatedAt: 100 },
        { id: 'tx-2', status: ITransactionStatus.GeneratingTransaction, initiatedAt: 200 }
      ];
      mockTransactionsFilter.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce(txs)
      });

      const result = await getAllUncompletedTransactions();

      expect(result).toHaveLength(2);
    });
  });

  describe('getFailedTransactions', () => {
    it('returns failed transactions sorted by initiatedAt', async () => {
      const tx1 = { id: 'tx-1', status: ITransactionStatus.Failed, initiatedAt: 200 };
      const tx2 = { id: 'tx-2', status: ITransactionStatus.Failed, initiatedAt: 100 };
      mockTransactionsFilter.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce([tx1, tx2])
      });

      const result = await getFailedTransactions();

      expect(result[0].id).toBe('tx-2');
    });
  });

  describe('getCompletedTransactions', () => {
    it('returns completed transactions for account', async () => {
      const txs = [
        { id: 'tx-1', status: ITransactionStatus.Completed, accountId: 'acc-1', completedAt: 100 },
        { id: 'tx-2', status: ITransactionStatus.Completed, accountId: 'acc-2', completedAt: 200 }
      ];
      mockTransactionsFilter.mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValueOnce(txs)
      });

      const result = await getCompletedTransactions('acc-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tx-1');
    });

    it('includes failed transactions when includeFailed is true', async () => {
      const completedTxs = [
        { id: 'tx-1', status: ITransactionStatus.Completed, accountId: 'acc-1', completedAt: 100 }
      ];
      const failedTxs = [
        { id: 'tx-2', status: ITransactionStatus.Failed, accountId: 'acc-1', initiatedAt: 200 }
      ];

      mockTransactionsFilter
        .mockReturnValueOnce({ toArray: jest.fn().mockResolvedValueOnce(completedTxs) })
        .mockReturnValueOnce({ toArray: jest.fn().mockResolvedValueOnce(failedTxs) });

      const result = await getCompletedTransactions('acc-1', undefined, undefined, true);

      expect(result).toHaveLength(2);
    });
  });

  describe('getTransactionById', () => {
    it('returns transaction when found', async () => {
      const tx = { id: 'tx-1', accountId: 'acc-1' };
      mockTransactionsWhere.mockReturnValueOnce({
        first: jest.fn().mockResolvedValueOnce(tx)
      });

      const result = await getTransactionById('tx-1');

      expect(result).toEqual(tx);
    });

    it('throws when transaction not found', async () => {
      mockTransactionsWhere.mockReturnValueOnce({
        first: jest.fn().mockResolvedValueOnce(undefined)
      });

      await expect(getTransactionById('nonexistent')).rejects.toThrow('Transaction not found');
    });
  });

  describe('cancelTransactionById', () => {
    it('cancels transaction when found', async () => {
      const tx = { id: 'tx-1' };
      const mockModify = jest.fn();
      mockTransactionsWhere
        .mockReturnValueOnce({ first: jest.fn().mockResolvedValueOnce(tx) })
        .mockReturnValueOnce({ modify: mockModify });

      await cancelTransactionById('tx-1');

      expect(mockModify).toHaveBeenCalled();
    });

    it('does nothing when transaction not found', async () => {
      mockTransactionsWhere.mockReturnValueOnce({
        first: jest.fn().mockResolvedValueOnce(undefined)
      });

      // Should not throw
      await cancelTransactionById('nonexistent');
    });
  });

  describe('MAX_WAIT_BEFORE_CANCEL', () => {
    it('is 30 minutes in milliseconds', () => {
      expect(MAX_WAIT_BEFORE_CANCEL).toBe(30 * 60_000);
    });
  });
});

// Note: The completeCustomTransaction test below uses jest.isolateModules
// which conflicts with module-level mocks. It's kept as a separate isolated test.
describe('completeCustomTransaction (isolated)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('marks transaction completed even when output notes are non-private', async () => {
    const dbTx: any = { id: 'tx-1', status: 0 };
    const modify = jest.fn(async (fn: (tx: any) => void) => fn(dbTx));

    jest.doMock('lib/miden/repo', () => ({
      transactions: {
        where: jest.fn(() => ({
          first: jest.fn(async () => dbTx),
          modify
        }))
      }
    }));

    jest.doMock('../helpers', () => ({
      toNoteTypeString: jest.fn(() => 'public')
    }));

    jest.doMock('./helpers', () => ({
      interpretTransactionResult: jest.fn((tx: any) => ({ ...tx }))
    }));

    jest.doMock('./notes', () => ({
      importAllNotes: jest.fn(),
      queueNoteImport: jest.fn(),
      registerOutputNote: jest.fn()
    }));

    jest.doMock('lib/miden-worker/consumeNoteId', () => ({
      consumeNoteId: jest.fn()
    }));
    jest.doMock('lib/miden-worker/sendTransaction', () => ({
      sendTransaction: jest.fn()
    }));
    jest.doMock('lib/miden-worker/submitTransaction', () => ({
      submitTransaction: jest.fn()
    }));

    jest.doMock('@demox-labs/miden-sdk', () => ({
      Address: { fromBech32: jest.fn() }
    }));

    jest.doMock('../sdk/miden-client', () => ({
      getMidenClient: jest.fn()
    }));

    let ITransactionStatus: any;
    let completeCustomTransaction: any;

    jest.isolateModules(() => {
      ({ ITransactionStatus } = require('../db/types'));
      ({ completeCustomTransaction } = require('./transactions'));
    });

    const nonPrivateNote = {
      metadata: () => ({ noteType: () => ({}) })
    };

    const result: any = {
      executedTransaction: () => ({
        outputNotes: () => ({
          notes: () => [nonPrivateNote]
        })
      })
    };

    const tx: any = { id: 'tx-1' };

    await completeCustomTransaction(tx, result);

    expect(modify).toHaveBeenCalledTimes(1);
    expect(dbTx.status).toBe(ITransactionStatus.Completed);
    expect(dbTx.completedAt).toEqual(expect.any(Number));
  });
});
