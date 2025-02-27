import {
  WalletAdapterNetwork,
  DecryptPermission,
  MidenSendTransaction,
  MidenTransaction
} from '@demox-labs/miden-wallet-adapter-base';
import { nanoid } from 'nanoid';

import {
  MidenDAppErrorType,
  MidenDAppMessageType,
  MidenDAppMetadata,
  MidenDAppPermission,
  MidenDAppRequest,
  MidenDAppResponse,
  MidenPageMessage,
  MidenPageMessageType
} from './types';

export function isAvailable() {
  return new Promise<boolean>(resolve => {
    const handleMessage = (evt: MessageEvent) => {
      if (evt.source === window && evt.data?.type === MidenPageMessageType.Response && evt.data?.payload === 'PONG') {
        done(true);
      }
    };

    const done = (result: boolean) => {
      resolve(result);
      window.removeEventListener('message', handleMessage);
      clearTimeout(t);
    };

    send({
      type: MidenPageMessageType.Request,
      payload: 'PING'
    });
    window.addEventListener('message', handleMessage);
    const t = setTimeout(() => done(false), 500);
  });
}

export function onAvailabilityChange(callback: (available: boolean) => void) {
  let t: any;
  let currentStatus = false;
  const check = async (attempt = 0) => {
    const initial = attempt < 5;
    const available = await isAvailable();
    if (currentStatus !== available) {
      callback(available);
      currentStatus = available;
    }
    t = setTimeout(check, available ? 10_000 : !initial ? 5_000 : 0, initial ? attempt + 1 : attempt);
  };
  check();
  return () => clearTimeout(t);
}

export function onPermissionChange(callback: (permission: MidenDAppPermission) => void) {
  let t: any;
  let currentPerm: MidenDAppPermission = null;
  const check = async () => {
    try {
      const perm = await getCurrentPermission();
      if (!permissionsAreEqual(perm, currentPerm)) {
        callback(perm);
        currentPerm = perm;
      }
    } catch {}

    t = setTimeout(check, 10_000);
  };
  check();
  return () => clearTimeout(t);
}

export async function getCurrentPermission() {
  const res = await request({
    type: MidenDAppMessageType.GetCurrentPermissionRequest
  });
  assertResponse(res.type === MidenDAppMessageType.GetCurrentPermissionResponse);
  return res.permission;
}

export async function requestPermission(
  appMeta: MidenDAppMetadata,
  force: boolean,
  decryptPermission: DecryptPermission,
  network: WalletAdapterNetwork,
  programs?: string[]
) {
  const res = await request({
    type: MidenDAppMessageType.PermissionRequest,
    appMeta,
    force,
    decryptPermission,
    network,
    programs
  });
  assertResponse(res.type === MidenDAppMessageType.PermissionResponse);
  return {
    rpc: res.network,
    publicKey: res.publicKey,
    decryptPermission: res.decryptPermission,
    programs: res.programs
  };
}

export async function requestDisconnect() {
  const res = await request({
    type: MidenDAppMessageType.DisconnectRequest
  });
  assertResponse(res.type === MidenDAppMessageType.DisconnectResponse);
  return res;
}

export async function requestSend(sourcePublicKey: string, transaction: MidenSendTransaction) {
  const res = await request({
    type: MidenDAppMessageType.SendTransactionRequest,
    sourcePublicKey,
    transaction
  });
  assertResponse(res.type === MidenDAppMessageType.SendTransactionResponse);
  return res.transactionId;
}

export async function requestTransaction(sourcePublicKey: string, transaction: MidenTransaction) {
  const res = await request({
    type: MidenDAppMessageType.TransactionRequest,
    sourcePublicKey,
    transaction
  });
  assertResponse(res.type === MidenDAppMessageType.TransactionResponse);
  return res.transactionId;
}

function request(payload: MidenDAppRequest) {
  return new Promise<MidenDAppResponse>((resolve, reject) => {
    const reqId = nanoid();
    const handleMessage = (evt: MessageEvent) => {
      const res = evt.data as MidenPageMessage;
      switch (true) {
        case evt.source !== window || res?.reqId !== reqId:
          return;

        case res?.type === MidenPageMessageType.Response:
          resolve(res.payload);
          window.removeEventListener('message', handleMessage);
          break;

        case res?.type === MidenPageMessageType.ErrorResponse:
          reject(createError(res.payload));
          window.removeEventListener('message', handleMessage);
          break;
      }
    };

    send({
      type: MidenPageMessageType.Request,
      payload,
      reqId
    });

    window.addEventListener('message', handleMessage);
  });
}

function permissionsAreEqual(aPerm: MidenDAppPermission, bPerm: MidenDAppPermission) {
  if (aPerm === null) return bPerm === null;
  return aPerm.publicKey === bPerm?.publicKey && aPerm.rpc === bPerm?.rpc;
}

function createError(payload: any) {
  console.log('Error: ', payload);
  switch (true) {
    case payload === MidenDAppErrorType.NotGranted:
      return new NotGrantedMidenWalletError();

    case payload === MidenDAppErrorType.NotFound:
      return new NotFoundMidenWalletError();

    case payload === MidenDAppErrorType.InvalidParams:
      return new InvalidParamsMidenWalletError();

    default:
      return new MidenWalletError();
  }
}

export function assertResponse(condition: any): asserts condition {
  if (!condition) {
    throw new Error('Invalid response recieved');
  }
}

function send(msg: MidenPageMessage) {
  window.postMessage(msg, '*');
}

export class MidenWalletError implements Error {
  name = 'MidenWalletError';
  message = 'An unknown error occured. Please try again or report it';
}

export class NotGrantedMidenWalletError extends MidenWalletError {
  name = 'NotGrantedMidenWalletError';
  message = 'Permission Not Granted';
}

export class NotFoundMidenWalletError extends MidenWalletError {
  name = 'NotFoundMidenWalletError';
  message = 'Account Not Found. Try connect again';
}

export class InvalidParamsMidenWalletError extends MidenWalletError {
  name = 'InvalidParamsMidenWalletError';
  message = 'Some of the parameters you provided are invalid';
}
