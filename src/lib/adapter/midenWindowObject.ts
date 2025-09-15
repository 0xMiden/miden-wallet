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
  signMessage,
  requestAssets
} from 'lib/adapter/client';
import { MidenDAppPermission } from 'lib/adapter/types';
import { b64ToU8, u8ToB64 } from 'lib/shared/helpers';

export class MidenWindowObject extends EventEmitter<MidenWalletEvents> implements MidenWallet {
  accountId?: string | undefined;
  publicKey?: Uint8Array | undefined;
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

  async requestAssets(): Promise<{ assets: any[] }> {
    const res = await requestAssets(this.accountId!);
    return { assets: res };
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
    this.publicKey = perm.publicKey;
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
