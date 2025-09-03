import {
  EventEmitter,
  WalletAdapterNetwork,
  DecryptPermission,
  MidenTransaction,
  MidenSendTransaction,
  MidenConsumeTransaction,
  MidenWallet,
  MidenWalletEvents
} from '@demox-labs/miden-wallet-adapter';

import {
  requestPermission,
  requestTransaction,
  requestDisconnect,
  onPermissionChange,
  isAvailable,
  requestSend,
  requestConsume,
  requestPrivateNotes
} from 'lib/adapter/client';
import { MidenDAppPermission } from 'lib/adapter/types';

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

  async connect(
    decryptPermission: DecryptPermission,
    network: WalletAdapterNetwork,
    programs?: string[]
  ): Promise<void> {
    const perm = await requestPermission(
      { name: window.location.hostname },
      false,
      decryptPermission,
      network,
      programs
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
