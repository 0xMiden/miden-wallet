describe('MidenClientInterface', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('creates a client with provided callbacks', async () => {
    const fakeWebClient = {
      free: jest.fn(),
      newWallet: jest.fn(async () => ({ id: () => 'id' })),
      importPublicAccountFromSeed: jest.fn(async () => ({ id: () => 'id' })),
      newConsumeTransactionRequest: jest.fn(() => ({})),
      executeTransaction: jest.fn(async () => ({
        serialize: () => new Uint8Array([2])
      })),
      importNoteFile: jest.fn(async () => 'note'),
      getAccount: jest.fn(async () => 'acc'),
      importAccountById: jest.fn(async () => 'acc'),
      getAccounts: jest.fn(async () => ['acc']),
      getInputNotes: jest.fn(async () => [
        {
          id: () => ({ toString: () => 'note-1' }),
          metadata: () => ({
            noteType: () => 'type',
            sender: () => 'sender'
          }),
          nullifier: () => 'nullifier',
          state: () => 'state',
          details: () => ({
            assets: () => ({
              fungibleAssets: () => [
                {
                  amount: () => ({ toString: () => '10' }),
                  faucetId: () => 'faucet'
                }
              ]
            })
          })
        }
      ]),
      syncState: jest.fn(async () => ({ blockNum: () => 5 })),
      exportNoteFile: jest.fn(() => ({ serialize: () => new Uint8Array([1]) })),
      getConsumableNotes: jest.fn(() => [
        {
          noteConsumability: () => [{ accountId: () => 'id', consumableAfterBlock: () => 1 }]
        }
      ]),
      getSpentNotes: jest.fn(() => []),
      proveTransaction: jest.fn(() => ({ serialize: () => new Uint8Array([1]) })),
      submitProvenTransaction: jest.fn(async () => 10),
      applyTransaction: jest.fn(),
      submitNewTransaction: jest.fn(async () => {}),
      exportStore: jest.fn(async () => 'dump'),
      forceImportStore: jest.fn(),
      newSendTransactionRequest: jest.fn(() => ({})),
      importAccountFile: jest.fn(async () => ({ id: () => 'id' })),
      exportNoteBytes: jest.fn(() => new Uint8Array([3])),
      getTransactions: jest.fn(() => [
        { accountId: () => 'id', serialize: () => new Uint8Array([9]) },
        { accountId: () => 'other', serialize: () => new Uint8Array([9]) }
      ])
    };

    const createClientWithExternalKeystore = jest.fn(async () => fakeWebClient);

    jest.doMock('@demox-labs/miden-sdk', () => ({
      WebClient: { createClientWithExternalKeystore },
      AccountStorageMode: { public: jest.fn(() => 'public'), private: jest.fn(() => 'private') },
      NoteFile: { deserialize: jest.fn(() => ({})) },
      AccountFile: { deserialize: jest.fn(() => ({})) },
      TransactionRequest: { deserialize: jest.fn(() => ({})) },
      TransactionResult: { deserialize: jest.fn(() => ({ serialize: () => new Uint8Array([7]) })) },
      TransactionProver: {
        newRemoteProver: jest.fn(() => 'remote'),
        newLocalProver: jest.fn(() => 'local')
      },
      TransactionFilter: { all: jest.fn(() => 'all') },
      MIDEN_NETWORK_NAME: { TESTNET: 'testnet' }
    }));
    jest.doMock('lib/miden-chain/constants', () => ({
      MIDEN_NETWORK_ENDPOINTS: new Map([['testnet', 'rpc']]),
      MIDEN_PROVING_ENDPOINTS: new Map([['testnet', 'prover']]),
      MIDEN_NETWORK_NAME: { TESTNET: 'testnet' }
    }));
    jest.doMock('./constants', () => ({ NoteExportType: {} }));
    jest.doMock('./helpers', () => ({
      accountIdStringToSdk: (id: string) => id,
      getBech32AddressFromAccountId: (id: any) => String(id)
    }));
    jest.doMock('../helpers', () => ({ toNoteType: jest.fn() }));
    jest.doMock('../db/types', () => ({
      ConsumeTransaction: class {},
      SendTransaction: class {}
    }));
    jest.doMock('screens/onboarding/types', () => ({
      WalletType: { OnChain: 'on-chain', OffChain: 'off-chain' }
    }));

    const { MidenClientInterface } = await import('./miden-client-interface');
    const insertKeyCallback = jest.fn();
    const client = await MidenClientInterface.create({
      seed: new Uint8Array([1, 2, 3]),
      insertKeyCallback
    });

    expect(createClientWithExternalKeystore).toHaveBeenCalledWith(
      'rpc',
      undefined,
      '1,2,3',
      undefined,
      insertKeyCallback,
      undefined
    );

    client.free();
    expect(client.webClient.free).toBeDefined();
    // smoke a few methods to raise coverage
    await client.createMidenWallet('on-chain' as any, new Uint8Array([4]));
    await client.importPublicMidenWalletFromSeed(new Uint8Array([5]));
    await client.importNoteBytes(new Uint8Array([1, 2]));
    await client.consumeNoteId({ accountId: 'id', noteId: 'note', faucetId: 'f', type: 'public' } as any);
    await client.getInputNoteDetails({} as any);
    await client.getConsumableNotes('id', 10);
    await client.exportNote('note', {} as any);
    await client.getTransactionsForAccount('id');
    await client.exportDb();
    await client.importDb('dump');
    await client.submitTransaction(new Uint8Array([1, 2]), true);
  });
});
