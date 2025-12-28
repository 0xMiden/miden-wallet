jest.mock('webextension-polyfill');
jest.mock('@demox-labs/miden-wallet-adapter-base');
jest.mock('nanoid');
jest.mock('app/hooks/useGasToken');
jest.mock('app/hooks/useMidenFaucetId');
jest.mock('lib/miden/sdk/miden-client-interface', () =>
  jest.requireActual('../../../__mocks__/lib/miden/sdk/miden-client-interface')
);
jest.mock('lib/miden/sdk/miden-client', () =>
  jest.requireActual('../../../__mocks__/lib/miden/sdk/miden-client')
);
jest.mock('lib/amp/amp-interface', () => jest.requireActual('../../../__mocks__/lib/amp/amp-interface'));
jest.mock('lib/i18n/numbers');
jest.mock('utils/string');
jest.mock('lib/miden/back/vault', () => jest.requireActual('../../../__mocks__/lib/miden/back/vault'));
jest.mock(
  'lib/miden/front',
  () => ({
    __esModule: true,
    ...jest.requireActual('lib/miden/front/client'),
    MidenProvider: ({ children }: any) => children
  }),
  { virtual: true }
);

import browser from 'webextension-polyfill';
import { start } from 'lib/miden/back/main';
import { WalletMessageType, WalletStatus, GetStateResponse } from 'lib/shared/types';
import { request } from 'lib/miden/front/client';
import { IntercomClient } from 'lib/intercom';
import { MidenMessageType, MidenSharedStorageKey } from 'lib/miden/types';

const PASSWORD = 'pw';
const MNEMONIC = 'test test test test test test test test test test test test';

describe('miden wallet smoke harness', () => {
  beforeAll(async () => {
    await start();
  });

  it('creates a wallet and exposes ready state over intercom', async () => {
    const readyState = await ensureWalletReady();

    expect(readyState.status).toBe(WalletStatus.Ready);
    expect(readyState.accounts).toHaveLength(1);
    expect(readyState.currentAccount?.publicKey).toBe('miden-account-1');
    expect(readyState.ownMnemonic).toBe(true);
  });

  it('locks and unlocks via background requests', async () => {
    await ensureWalletReady();

    await request({ type: WalletMessageType.LockRequest });
    const lockedState = await getState();
    expect(lockedState.status).toBe(WalletStatus.Locked);
    expect(lockedState.accounts).toHaveLength(0);

    await waitForStateUpdate(() =>
      request({
        type: WalletMessageType.UnlockRequest,
        password: PASSWORD
      })
    );

    const readyState = await getState();
    expect(readyState.status).toBe(WalletStatus.Ready);
    expect(readyState.accounts).toHaveLength(1);
  });

  it('responds to dApp page ping', async () => {
    await ensureWalletReady();
    await browser.storage.local.set({ [MidenSharedStorageKey.DAppEnabled]: true });

    const pingRes = await request({
      type: MidenMessageType.PageRequest,
      origin: 'https://example.com',
      payload: 'PING'
    });

    expect(pingRes.type).toBe(MidenMessageType.PageResponse);
    expect((pingRes as any).payload).toBe('PONG');
  });

  it('signs transactions through background', async () => {
    await ensureWalletReady();

    const res = await request({
      type: WalletMessageType.SignTransactionRequest,
      publicKey: 'miden-account-1',
      signingInputs: 'payload'
    });

    expect(res.type).toBe(WalletMessageType.SignTransactionResponse);
    expect((res as any).signature).toBe('signed:payload');
  });

  it('updates settings and broadcasts state', async () => {
    await ensureWalletReady();

    await waitForStateUpdate(() =>
      request({
        type: WalletMessageType.UpdateSettingsRequest,
        settings: { contacts: [{ address: 'addr1', name: 'Alice' }] }
      })
    );

    const state = await getState();
    expect(state.settings?.contacts?.[0]?.name).toBe('Alice');
  });
});

async function getState() {
  const res = (await request({
    type: WalletMessageType.GetStateRequest
  })) as GetStateResponse;
  return res.state;
}

async function waitForStateUpdate(action?: () => Promise<any>) {
  const client = new IntercomClient();
  const stateUpdateReceived = new Promise<void>(resolve => {
    const unsubscribe = client.subscribe(msg => {
      if (msg?.type === WalletMessageType.StateUpdated) {
        unsubscribe();
        resolve();
      }
    });
  });

  if (action) {
    await action();
  }

  await stateUpdateReceived;
}

async function ensureWalletReady() {
  const state = await getState();
  switch (state.status) {
    case WalletStatus.Ready:
      return state;
    case WalletStatus.Locked:
      await waitForStateUpdate(() =>
        request({
          type: WalletMessageType.UnlockRequest,
          password: PASSWORD
        })
      );
      return getState();
    case WalletStatus.Idle:
    default:
      await waitForStateUpdate(() =>
        request({
          type: WalletMessageType.NewWalletRequest,
          password: PASSWORD,
          mnemonic: MNEMONIC,
          ownMnemonic: true
        })
      );
      return getState();
  }
}
