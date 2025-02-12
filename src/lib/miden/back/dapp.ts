import {
  DecryptPermission,
  MidenCustomTransaction,
  MintTransaction,
  SendTransaction,
  TransactionType
} from '@demox-labs/miden-wallet-adapter-base';
import { nanoid } from 'nanoid';
import browser, { Runtime } from 'webextension-polyfill';

import {
  MidenDAppDisconnectRequest,
  MidenDAppDisconnectResponse,
  MidenDAppErrorType,
  MidenDAppExecutionRequest,
  MidenDAppExecutionResponse,
  MidenDAppGetCurrentPermissionResponse,
  MidenDAppMessageType,
  MidenDAppPermissionRequest,
  MidenDAppPermissionResponse,
  MidenDAppTransactionRequest,
  MidenDAppTransactionResponse
} from 'lib/adapter/types';
import * as Actions from 'lib/miden/back/actions';
import { intercom } from 'lib/miden/back/defaults';
import { Vault } from 'lib/miden/back/vault';
import { NETWORKS } from 'lib/miden/networks';
import {
  DappMetadata,
  MidenDAppPayload,
  MidenDAppSession,
  MidenDAppSessions,
  MidenMessageType,
  MidenRequest,
  QueuedTransactionType
} from 'lib/miden/types';
import { WalletStatus } from 'lib/shared/types';

import { requestCustomTransaction } from '../activity/transactions';
import { fetchFromStorage, putToStorage } from '../front';
import { QUEUED_TRANSACTIONS_KEY } from '../front/queued-transactions';
import { store, withUnlocked } from './store';

const CONFIRM_WINDOW_WIDTH = 380;
const CONFIRM_WINDOW_HEIGHT = 632;
const AUTODECLINE_AFTER = 120_000;
const STORAGE_KEY = 'dapp_sessions';

export async function getCurrentPermission(origin: string): Promise<MidenDAppGetCurrentPermissionResponse> {
  const currentAccountPubKey = await Vault.getCurrentAccountPublicKey();
  const dApp = currentAccountPubKey ? await getDApp(origin, currentAccountPubKey) : undefined;
  const permission = dApp
    ? {
        rpc: await getNetworkRPC(dApp.network),
        publicKey: dApp.publicKey,
        decryptPermission: dApp.decryptPermission
      }
    : null;
  return {
    type: MidenDAppMessageType.GetCurrentPermissionResponse,
    permission
  };
}

export async function requestDisconnect(
  origin: string,
  _req: MidenDAppDisconnectRequest
): Promise<MidenDAppDisconnectResponse> {
  const currentAccountPubKey = await Vault.getCurrentAccountPublicKey();
  if (currentAccountPubKey) {
    const dApp = currentAccountPubKey ? await getDApp(origin, currentAccountPubKey) : undefined;
    if (dApp) {
      await removeDApp(origin, currentAccountPubKey);
      return {
        type: MidenDAppMessageType.DisconnectResponse
      };
    }
  }
  throw new Error(MidenDAppErrorType.NotFound);
}

export async function requestPermission(
  origin: string,
  req: MidenDAppPermissionRequest
): Promise<MidenDAppPermissionResponse> {
  console.log('requestPermission, dapp.ts');
  let network = req?.network?.toString();
  const reqChainId = network;

  if (![isAllowedNetwork(), typeof req?.appMeta?.name === 'string'].every(Boolean)) {
    throw new Error(MidenDAppErrorType.InvalidParams);
  }
  const networkRpc = await getNetworkRPC(reqChainId);
  const currentAccountPubKey = await Vault.getCurrentAccountPublicKey();
  const dApp = currentAccountPubKey ? await getDApp(origin, currentAccountPubKey) : undefined;

  // const current = await getCurrentMidenNetwork();
  // const currentChainId = loadChainId(current.rpcBaseURL);

  // Assert that the dApp network or the req.network matches the current chain id
  // if (reqChainId.toString() !== currentChainId && dApp?.network?.toString() !== currentChainId) {
  //   throw new Error(MidenDAppErrorType.NetworkNotGranted);
  // }

  if (!req.force && dApp && req.appMeta.name === dApp.appMeta.name) {
    if (store.getState().status === WalletStatus.Locked) {
      return generatePromisifyRequestPermission(
        origin,
        reqChainId,
        networkRpc,
        dApp.appMeta,
        !!dApp,
        dApp.decryptPermission,
        dApp.programs
      );
    }
    return {
      type: MidenDAppMessageType.PermissionResponse,
      network: reqChainId,
      publicKey: dApp.publicKey,
      decryptPermission: dApp.decryptPermission,
      programs: dApp.programs
    };
  }

  return generatePromisifyRequestPermission(
    origin,
    reqChainId,
    networkRpc,
    req.appMeta,
    !!dApp,
    req.decryptPermission,
    req.programs
  );
}

export async function generatePromisifyRequestPermission(
  origin: string,
  network: string,
  networkRpc: string,
  appMeta: DappMetadata,
  existingPermission: boolean,
  decryptPermission?: DecryptPermission,
  programs?: string[]
): Promise<MidenDAppPermissionResponse> {
  return new Promise(async (resolve, reject) => {
    const id = nanoid();

    await requestConfirm({
      id,
      payload: {
        type: 'connect',
        origin,
        networkRpc,
        appMeta,
        decryptPermission: decryptPermission || DecryptPermission.NoDecrypt,
        programs,
        existingPermission
      },
      onDecline: () => {
        reject(new Error(MidenDAppErrorType.NotGranted));
      },
      handleIntercomRequest: async (confirmReq, decline) => {
        if (confirmReq?.type === MidenMessageType.DAppPermConfirmationRequest && confirmReq?.id === id) {
          const { confirmed, accountPublicKey, decryptPermission } = confirmReq;
          if (confirmed && accountPublicKey) {
            if (!existingPermission)
              await setDApp(origin, {
                network,
                appMeta,
                publicKey: accountPublicKey,
                decryptPermission: decryptPermission || DecryptPermission.NoDecrypt,
                programs: programs
              });
            resolve({
              type: MidenDAppMessageType.PermissionResponse,
              publicKey: accountPublicKey,
              network,
              decryptPermission: decryptPermission,
              programs
            });
          } else {
            decline();
          }

          return {
            type: MidenMessageType.DAppPermConfirmationResponse
          };
        }
        return undefined;
      }
    });
  });
}

export async function requestTransaction(
  origin: string,
  req: MidenDAppTransactionRequest
): Promise<MidenDAppTransactionResponse> {
  console.log(req, 'requestTransaction, dapp.ts');
  if (!req?.sourcePublicKey || !req?.transaction) {
    throw new Error(MidenDAppErrorType.InvalidParams);
  }

  const dApp = await getDApp(origin, req.sourcePublicKey);

  if (!dApp) {
    throw new Error(MidenDAppErrorType.NotGranted);
  }

  if (req.sourcePublicKey !== dApp.publicKey) {
    throw new Error(MidenDAppErrorType.NotFound);
  }

  return new Promise((resolve, reject) =>
    generatePromisifyTransaction(resolve, reject, dApp, req, MidenDAppMessageType.TransactionResponse)
  );
}

type CorrespondingResponse<T> = T extends MidenDAppExecutionRequest
  ? MidenDAppExecutionResponse
  : T extends MidenDAppTransactionRequest
  ? MidenDAppTransactionResponse
  : never;

type CorrespondingResponseMessageType<T> = T extends MidenDAppExecutionResponse
  ? MidenDAppMessageType.ExecutionResponse
  : T extends MidenDAppTransactionResponse
  ? MidenDAppMessageType.TransactionResponse
  : never;

const generatePromisifyTransaction = async <
  TRequest extends MidenDAppExecutionRequest | MidenDAppTransactionRequest,
  TResponse extends CorrespondingResponse<TRequest>,
  TMessageType extends CorrespondingResponseMessageType<TResponse>
>(
  resolve: (value: TResponse | PromiseLike<TResponse>) => void,
  reject: (reason?: any) => void,
  dApp: MidenDAppSession,
  req: TRequest,
  messageType: TMessageType
) => {
  // const current = await getCurrentMidenNetwork();
  // const currentChainId = loadChainId(current.rpcBaseURL);
  const id = nanoid();
  const networkRpc = await getNetworkRPC(dApp.network);

  // if (req.transaction.chainId !== currentChainId) {
  //   reject(
  //     new Error(
  //       `${MidenDAppErrorType.InvalidParams}: Wallet Using Network ${currentChainId}, Transaction Requested: ${req.transaction.chainId}`
  //     )
  //   );
  // }

  let transactionMessages: string[] = [];
  try {
    transactionMessages = await withUnlocked(async () => {
      const { type, payload } = req.transaction;
      switch (type) {
        case TransactionType.Send:
          const sendTransaction = payload as SendTransaction;
          if (!sendTransaction.recipientAccountId || !sendTransaction.amount || !sendTransaction.noteType) {
            reject(new Error(`${MidenDAppErrorType.InvalidParams}: Invalid SendTransaction payload`));
          }

          return formatSendTransactionPreview(sendTransaction);
        case TransactionType.Mint:
          const mintTransaction = payload as MintTransaction;
          if (!mintTransaction.recipientAccountId || !mintTransaction.amount || !mintTransaction.noteType) {
            reject(new Error(`${MidenDAppErrorType.InvalidParams}: Invalid MintTransaction payload`));
          }

          return formatMintTransactionPreview(mintTransaction);
        case TransactionType.Custom:
          const customTransaction = payload as MidenCustomTransaction;
          if (!customTransaction.accountId || !customTransaction.transactionRequest) {
            reject(new Error(`${MidenDAppErrorType.InvalidParams}: Invalid CustomTransaction payload`));
          }

          return formatCustomTransactionPreview(customTransaction);
      }
    });
  } catch (e) {
    reject(new Error(`${MidenDAppErrorType.InvalidParams}: ${e}`));
  }

  await requestConfirm({
    id,
    payload: {
      type: 'transaction',
      origin,
      networkRpc,
      appMeta: dApp.appMeta,
      sourcePublicKey: req.sourcePublicKey,
      transactionMessages,
      preview: null
    },
    onDecline: () => {
      reject(new Error(MidenDAppErrorType.NotGranted));
    },
    handleIntercomRequest: async (confirmReq, decline) => {
      if (confirmReq?.type === MidenMessageType.DAppTransactionConfirmationRequest && confirmReq?.id === id) {
        if (confirmReq.confirmed) {
          try {
            const { type, payload } = req.transaction;
            switch (type) {
              case TransactionType.Send:
                const queuedTransactions = await fetchFromStorage(QUEUED_TRANSACTIONS_KEY);
                const newQueuedTransactions = [
                  ...queuedTransactions,
                  {
                    type: QueuedTransactionType.SendTransaction,
                    data: { ...req.transaction.payload, delegateTransaction: confirmReq.delegate }
                  }
                ];
                await putToStorage(QUEUED_TRANSACTIONS_KEY, newQueuedTransactions);
                resolve({
                  type: messageType,
                  transactionId: ''
                } as any);
                break;
              case TransactionType.Mint:
                await Actions.requestMintTransaction(payload as MintTransaction);
                break;
              case TransactionType.Custom:
                const { accountId, transactionRequest } = payload as MidenCustomTransaction;
                await requestCustomTransaction(accountId, transactionRequest);
                break;
              default:
                throw new Error('Unable to create transaction');
            }
          } catch (e) {
            reject(new Error(`${MidenDAppErrorType.InvalidParams}: ${e}`));
          }
        } else {
          decline();
        }

        return {
          type: MidenMessageType.DAppTransactionConfirmationResponse
        };
      }
      return undefined;
    }
  });
};

export async function getAllDApps(): Promise<MidenDAppSessions> {
  const dAppsSessions: MidenDAppSessions = (await browser.storage.local.get([STORAGE_KEY]))[STORAGE_KEY] || {};
  return dAppsSessions;
}

export async function getDApp(origin: string, publicKey: string): Promise<MidenDAppSession | undefined> {
  const sessions: MidenDAppSession[] = (await getAllDApps())[origin] || [];
  return sessions.find(session => session.publicKey === publicKey);
}

export async function setDApp(origin: string, permissions: MidenDAppSession) {
  const current = await getAllDApps();
  let currentDAppSessions: MidenDAppSession[] = current[origin] || [];
  let currentDAppSessionIdx = currentDAppSessions.findIndex(session => session.publicKey === permissions.publicKey);
  if (currentDAppSessionIdx >= 0) {
    currentDAppSessions[currentDAppSessionIdx] = permissions;
  } else {
    currentDAppSessions.push(permissions);
  }

  const newDApps = { ...current, [origin]: currentDAppSessions };
  await setDApps(newDApps);
  return newDApps;
}

export async function removeDApp(origin: string, publicKey: string) {
  const { [origin]: permissionsToRemove, ...restDApps } = await getAllDApps();
  const newPermissions = permissionsToRemove.filter(session => session.publicKey !== publicKey);
  await setDApps({ ...restDApps, [origin]: newPermissions });
  return restDApps;
}

export function cleanDApps() {
  return setDApps({});
}

function setDApps(newDApps: MidenDAppSessions) {
  return browser.storage.local.set({ [STORAGE_KEY]: newDApps });
}

type RequestConfirmParams = {
  id: string;
  payload: MidenDAppPayload;
  onDecline: () => void;
  handleIntercomRequest: (req: MidenRequest, decline: () => void) => Promise<any>;
};

async function requestConfirm({ id, payload, onDecline, handleIntercomRequest }: RequestConfirmParams) {
  let closing = false;
  const close = async () => {
    if (closing) return;
    closing = true;

    try {
      stopTimeout();
      stopRequestListening();
      stopWinRemovedListening();

      await closeWindow();
    } catch (_err) {}
  };

  const declineAndClose = () => {
    onDecline();
    close();
  };

  let knownPort: Runtime.Port | undefined;
  const stopRequestListening = intercom.onRequest(async (req: MidenRequest, port) => {
    if (req?.type === MidenMessageType.DAppGetPayloadRequest && req.id[0] === id) {
      knownPort = port;

      return {
        type: MidenMessageType.DAppGetPayloadResponse,
        payload
      };
    } else {
      if (knownPort !== port) return;

      const result = await handleIntercomRequest(req, onDecline);
      if (result) {
        close();
        return result;
      }
    }
  });

  const isWin = (await browser.runtime.getPlatformInfo()).os === 'win';

  let left = 0;
  let top = 0;
  try {
    const lastFocused = await browser.windows.getLastFocused();
    // Position window in top right corner of lastFocused window.

    top = Math.round(lastFocused.top! + lastFocused.height! / 2 - CONFIRM_WINDOW_HEIGHT / 2);
    left = Math.round(lastFocused.left! + lastFocused.width! / 2 - CONFIRM_WINDOW_WIDTH / 2);
  } catch {
    // The following properties are more than likely 0, due to being
    // opened from the background chrome process for the extension that
    // has no physical dimensions
    const { screenX, screenY, outerWidth, outerHeight } = window;
    top = Math.round(screenY + outerHeight / 2 - CONFIRM_WINDOW_HEIGHT / 2);
    left = Math.round(screenX + outerWidth / 2 - CONFIRM_WINDOW_WIDTH / 2);
  }

  const confirmWin = await browser.windows.create({
    type: 'popup',
    url: browser.runtime.getURL(`confirm.html#?id=${id}`),
    width: isWin ? CONFIRM_WINDOW_WIDTH + 16 : CONFIRM_WINDOW_WIDTH,
    height: isWin ? CONFIRM_WINDOW_HEIGHT + 17 : CONFIRM_WINDOW_HEIGHT,
    top: Math.max(top, 20),
    left: Math.max(left, 20)
  });

  // Firefox currently ignores left/top for create, but it works for update
  if (confirmWin.id && confirmWin.left !== left && confirmWin.state !== 'fullscreen') {
    await browser.windows.update(confirmWin.id, { left, top });
  }

  const closeWindow = async () => {
    if (confirmWin.id) {
      const win = await browser.windows.get(confirmWin.id);
      if (win.id) {
        await browser.windows.remove(win.id);
      }
    }
  };

  const handleWinRemoved = (winId: number) => {
    if (winId === confirmWin?.id) {
      declineAndClose();
    }
  };
  browser.windows.onRemoved.addListener(handleWinRemoved);
  const stopWinRemovedListening = () => browser.windows.onRemoved.removeListener(handleWinRemoved);

  // Decline after timeout
  const t = setTimeout(declineAndClose, AUTODECLINE_AFTER);
  const stopTimeout = () => clearTimeout(t);
}

export async function getNetworkRPC(net: string) {
  const targetRpc = NETWORKS.find(n => n.id === net)!.rpcBaseURL;
  return targetRpc;

  // if (typeof net === 'string') {
  //   try {
  //     const current = await getCurrentMidenNetwork();
  //     const [currentChainId, targetChainId] = await Promise.all([
  //       loadChainId(current.rpcBaseURL),
  //       loadChainId(targetRpc)
  //     ]);

  //     return targetChainId === null || currentChainId === targetChainId ? current.rpcBaseURL : targetRpc;
  //   } catch {
  //     return targetRpc;
  //   }
  // } else {
  //   return targetRpc;
  // }
}

function isAllowedNetwork() {
  return true;
  //return NETWORKS.some(n => !n.disabled && n.id === net.toString());
}

function assertDAppNetworkValid(dApp: MidenDAppSession | undefined, currentChainId: string | undefined) {
  if (dApp?.network?.toString() !== currentChainId) {
    throw new Error(MidenDAppErrorType.NetworkNotGranted);
  }
}

function formatSendTransactionPreview(transaction: SendTransaction): string[] {
  const tsTexts = [
    `Transfer note from faucet: ${transaction.faucetId} with inputs:`,
    `Recipient: ${transaction.recipientAccountId}`,
    `Amount: ${transaction.amount}`,
    `NoteType: ${transaction.noteType}`,
    `${transaction.recallBlocks}`
  ];

  return tsTexts;
}

function formatMintTransactionPreview(transaction: MintTransaction): string[] {
  const tsTexts = [
    `Mint note from faucet: ${transaction.faucetId} with inputs:`,
    `Recipient: ${transaction.recipientAccountId}`,
    `Amount: ${transaction.amount}`,
    `NoteType: ${transaction.noteType}`
  ];

  return tsTexts;
}

function formatCustomTransactionPreview(payload: MidenCustomTransaction): string[] {
  return [
    'This dApp is requesting a custom transaction,',
    'please ensure you know the details of the transaction before proceeding.'
  ];
}
