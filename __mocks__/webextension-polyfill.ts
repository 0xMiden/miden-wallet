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
  getPlatformInfo: async () => ({ os: 'mac' }),
  getURL: (path: string) => `chrome-extension://${runtimeId}/${path}`,
  reload: jest.fn()
};

const tabs = {
  create: jest.fn(),
  query: jest.fn().mockResolvedValue([]),
  remove: jest.fn()
};

const extension = {
  getViews: () => []
};

const windows = {
  create: jest.fn(async (opts?: any) => ({ id: 1, ...opts })),
  remove: jest.fn()
};

export default {
  runtime,
  tabs,
  extension,
  windows,
  storage
};
