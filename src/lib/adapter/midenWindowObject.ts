import {
  EventEmitter,
  WalletAdapterNetwork,
  PrivateDataPermission,
  MidenTransaction,
  MidenSendTransaction,
  MidenConsumeTransaction,
  AllowedPrivateData
} from '@demox-labs/miden-wallet-adapter-base';
import { MidenWallet, MidenWalletEvents } from '@demox-labs/miden-wallet-adapter-miden';

import {
  requestPermission,
  requestTransaction,
  requestDisconnect,
  onPermissionChange,
  isAvailable,
  requestSend,
  requestConsume,
  requestPrivateNotes,
  signMessage
} from 'lib/adapter/client';
import { MidenDAppPermission } from 'lib/adapter/types';

import { Word } from '@demox-labs/miden-sdk';

// sender
export function u8ToB64(u8: Uint8Array): string {
  let s = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < u8.length; i += CHUNK) {
    s += String.fromCharCode(...u8.subarray(i, i + CHUNK));
  }
  return btoa(s);
}

// receiver
export function b64ToU8(b64: string): Uint8Array {
  const s = atob(b64);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}

export class MidenWindowObject extends EventEmitter<MidenWalletEvents> implements MidenWallet {
  accountId?: string | undefined;
  permission?: MidenDAppPermission | undefined;
  appName?: string | undefined;
  network?: WalletAdapterNetwork | undefined;
  private clearAccountChangeInterval?: () => void | undefined;

  async isAvailable(): Promise<boolean> {
    return await isAvailable();
  }

  async requestSend(transaction: MidenSendTransaction): Promise<{ transactionId?: string | undefined }> {
    const res = await requestSend(this.accountId!, transaction);
    return { transactionId: res };
  }

  async requestConsume(transaction: MidenConsumeTransaction): Promise<{ transactionId?: string }> {
    const res = await requestConsume(this.accountId!, transaction);
    return { transactionId: res };
  }

  async requestTransaction(transaction: MidenTransaction): Promise<{ transactionId?: string | undefined }> {
    const res = await requestTransaction(this.accountId!, transaction);
    return { transactionId: res };
  }

  async requestPrivateNotes(): Promise<{ privateNotes: any[] }> {
    const res = await requestPrivateNotes(this.accountId!);
    return { privateNotes: res };
  }

  async signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }> {
    const messageAsB64 = u8ToB64(message);

    const signatureAsB64 = await signMessage(this.accountId!, messageAsB64);
    const signatureAsU8Array = b64ToU8(signatureAsB64);
    return { signature: signatureAsU8Array };
  }

  async connect(
    privateDataPermission: PrivateDataPermission,
    network: WalletAdapterNetwork,
    allowedPrivateData?: AllowedPrivateData
  ): Promise<void> {
    const perm = await requestPermission(
      { name: window.location.hostname },
      false,
      privateDataPermission,
      network,
      allowedPrivateData
    );
    this.permission = perm;
    this.accountId = perm.accountId;
    this.network = network;
    this.clearAccountChangeInterval = onPermissionChange((perm: MidenDAppPermission) => {
      this.emit('accountChange', perm);
    });
  }

  async disconnect(): Promise<void> {
    await requestDisconnect();
    this.accountId = undefined;
    this.permission = undefined;
    this.clearAccountChangeInterval && this.clearAccountChangeInterval();
  }
}
