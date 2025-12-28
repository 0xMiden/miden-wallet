import { start } from 'lib/miden/back/main';
import { WalletMessageType, WalletStatus, GetStateResponse } from 'lib/shared/types';
import { request } from 'lib/miden/front/client';
import { IntercomClient } from 'lib/intercom';

// Stub ESM-only deps that Jest can't parse in CommonJS mode
jest.mock('@demox-labs/miden-wallet-adapter-base', () => ({
  AllowedPrivateData: {},
  PrivateDataPermission: { None: 'None' },
  SignKind: { Transaction: 'Transaction', Message: 'Message' },
  SendTransaction: {}
}));
jest.mock('nanoid', () => ({ nanoid: () => 'id' }));
jest.mock(
  'app/hooks/useGasToken',
  () => ({
    useGasToken: () => ({ symbol: 'MID', decimals: 6 })
  }),
  { virtual: true }
);
jest.mock(
  'app/hooks/useMidenFaucetId',
  () => ({
    __esModule: true,
    default: () => 'faucet-id'
  }),
  { virtual: true }
);
jest.mock(
  'lib/miden/sdk/miden-client-interface',
  () => ({
    MidenClientInterface: class {
      static async create() {
        return new this();
      }
      free() {}
    }
  }),
  { virtual: true }
);
jest.mock(
  'lib/miden/sdk/miden-client',
  () => ({
    getMidenClient: async () => ({
      free() {},
      importPublicMidenWalletFromSeed: async () => 'miden-account-1',
      createMidenWallet: async () => 'miden-account-1',
      getAccounts: async () => [],
      getAccount: async () => null
    })
  }),
  { virtual: true }
);
jest.mock(
  'lib/amp/amp-interface',
  () => ({
    AmpInterface: class {
      connect() {}
    }
  }),
  { virtual: true }
);
jest.mock(
  'lib/miden/front',
  () => ({
    __esModule: true,
    ...jest.requireActual('lib/miden/front/client'),
    MidenProvider: ({ children }: any) => children
  }),
  { virtual: true }
);
jest.mock(
  'lib/i18n/numbers',
  () => ({
    formatNumber: (v: any) => String(v),
    formatFiat: (v: any) => String(v),
    formatPercentage: (v: any) => String(v)
  }),
  { virtual: true }
);
jest.mock(
  'utils/string',
  () => ({
    capitalizeFirstLetter: (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s),
    truncateAddress: (addr: string) => addr
  }),
  { virtual: true }
);

// Mock the browser APIs used by Intercom and background logic
jest.mock('webextension-polyfill', () => {
  type Listener<T extends any[] = any[]> = (...args: T) => void;
  const makeEvent = <T extends any[] = any[]>() => {
    const listeners = new Set<Listener<T>>();
    return {
      addListener: (fn: Listener<T>) => listeners.add(fn),
      removeListener: (fn: Listener<T>) => listeners.delete(fn),
      emit: (...args: T) => listeners.forEach(fn => fn(...args))
    };
  };

  const runtimeId = 'test-runtime-id';
  const onConnect = makeEvent<[any]>();

  const storageData: Record<string, any> = {};
  const storage = {
    local: {
      async get(keys: string[] | Record<string, unknown>) {
        if (Array.isArray(keys)) {
          return keys.reduce<Record<string, any>>((acc, key) => {
            acc[key] = storageData[key];
            return acc;
          }, {});
        }
        return { ...storageData };
      },
      async set(obj: Record<string, any>) {
        Object.assign(storageData, obj);
      }
    }
  };

  const makePort = (name?: string) => {
    const onMessage = makeEvent<[any, any]>();
    const onDisconnect = makeEvent<[]>();

    const port: any = {
      name,
      sender: { id: runtimeId },
      onMessage: {
        addListener: onMessage.addListener,
        removeListener: onMessage.removeListener
      },
      onDisconnect: {
        addListener: onDisconnect.addListener,
        removeListener: onDisconnect.removeListener
      },
      postMessage(msg: any) {
        if (port.peer) {
          port.peer.__emitMessage(msg);
        }
      },
      __emitMessage(msg: any) {
        onMessage.emit(msg, port);
      }
    };

    return port;
  };

  const runtime = {
    id: runtimeId,
    onConnect: {
      addListener: onConnect.addListener,
      removeListener: onConnect.removeListener
    },
    onInstalled: makeEvent(),
    onUpdateAvailable: makeEvent(),
    connect: (info?: any) => {
      const portA = makePort(info?.name);
      const portB = makePort(info?.name);
      (portA as any).peer = portB;
      (portB as any).peer = portA;
      onConnect.emit(portB);
      return portA;
    },
    getManifest: () => ({ manifest_version: 3 }),
    getURL: (path: string) => `chrome-extension://${runtimeId}/${path}`
  };

  const tabs = {
    create: jest.fn(),
    query: jest.fn().mockResolvedValue([]),
    remove: jest.fn()
  };

  const extension = {
    getViews: () => []
  };

  return {
    runtime,
    tabs,
    extension,
    storage
  };
});

// Lightweight in-memory Vault to avoid real crypto/WASM during the smoke test
jest.mock('lib/miden/back/vault', () => {
  const state = {
    exists: false,
    accounts: [] as any[],
    settings: {} as any,
    currentAccount: null as any,
    ownMnemonic: false
  };

  class FakeVault {
    static async isExist() {
      return state.exists;
    }

    static async spawn(_password: string, _mnemonic?: string, ownMnemonic?: boolean) {
      state.exists = true;
      const account = {
        publicKey: 'miden-account-1',
        name: 'Miden Account 1',
        isPublic: true,
        type: 0, // WalletType.OnChain
        hdIndex: 0
      };
      state.accounts = [account];
      state.currentAccount = account;
      state.ownMnemonic = Boolean(ownMnemonic);
    }

    static async spawnFromMidenClient(password: string, mnemonic: string) {
      return FakeVault.spawn(password, mnemonic, true);
    }

    static async setup(_password: string) {
      return new FakeVault();
    }

    static async getCurrentAccountPublicKey() {
      return state.currentAccount?.publicKey ?? null;
    }

    async fetchAccounts() {
      return state.accounts;
    }

    async fetchSettings() {
      return state.settings;
    }

    async getCurrentAccount() {
      return state.currentAccount;
    }

    async isOwnMnemonic() {
      return state.ownMnemonic;
    }

    async createHDAccount(_walletType: number, name?: string) {
      const index = state.accounts.length;
      const account = {
        publicKey: `miden-account-${index + 1}`,
        name: name ?? `Miden Account ${index + 1}`,
        isPublic: true,
        type: 0,
        hdIndex: index
      };
      state.accounts = [...state.accounts, account];
      return state.accounts;
    }

    async editAccountName(publicKey: string, name: string) {
      state.accounts = state.accounts.map(acc => (acc.publicKey === publicKey ? { ...acc, name } : acc));
      return { accounts: state.accounts };
    }

    async setCurrentAccount(publicKey: string) {
      const found = state.accounts.find(acc => acc.publicKey === publicKey) ?? null;
      state.currentAccount = found;
      return found;
    }

    async updateSettings(settings: any) {
      state.settings = { ...state.settings, ...settings };
      return state.settings;
    }

    async signTransaction(_publicKey: string, signingInputs: string) {
      return `signed:${signingInputs}`;
    }

    async getAuthSecretKey(key: string) {
      return `secret:${key}`;
    }
  }

  return { Vault: FakeVault };
});

describe('miden wallet smoke harness', () => {
  beforeAll(async () => {
    await start();
  });

  it('creates a wallet and exposes ready state over intercom', async () => {
    const initialRes = await request({
      type: WalletMessageType.GetStateRequest
    });

    expect(initialRes.type).toBe(WalletMessageType.GetStateResponse);
    const initialState = (initialRes as GetStateResponse).state;
    expect(initialState.status).toBe(WalletStatus.Idle);
    expect(initialState.networks.length).toBeGreaterThan(0);

    const client = new IntercomClient();
    const stateUpdateReceived = new Promise<void>(resolve => {
      const unsubscribe = client.subscribe(msg => {
        if (msg?.type === WalletMessageType.StateUpdated) {
          unsubscribe();
          resolve();
        }
      });
    });

    const newWalletRes = await request({
      type: WalletMessageType.NewWalletRequest,
      password: 'pw',
      mnemonic: 'test test test test test test test test test test test test',
      ownMnemonic: true
    });

    expect(newWalletRes.type).toBe(WalletMessageType.NewWalletResponse);

    await stateUpdateReceived;

    const readyRes = await request({
      type: WalletMessageType.GetStateRequest
    });

    expect(readyRes.type).toBe(WalletMessageType.GetStateResponse);
    const readyState = (readyRes as GetStateResponse).state;
    expect(readyState.status).toBe(WalletStatus.Ready);
    expect(readyState.accounts).toHaveLength(1);
    expect(readyState.currentAccount?.publicKey).toBe('miden-account-1');
    expect(readyState.ownMnemonic).toBe(true);
  });
});
