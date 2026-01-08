describe('completeCustomTransaction', () => {
  afterEach(() => {
    jest.resetModules();
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
