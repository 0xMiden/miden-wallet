import {
  EventEmitter,
  WalletAdapterNetwork,
  DecryptPermission,
  MidenTransaction,
  MidenSendTransaction,
  MidenConsumeTransaction
} from '@demox-labs/miden-wallet-adapter-base';
import { TridentWallet, TridentWalletEvents } from '@demox-labs/miden-wallet-adapter-trident';

import {
  requestPermission,
  requestTransaction,
  requestDisconnect,
  onPermissionChange,
  isAvailable,
  requestSend,
  requestConsume
} from 'lib/adapter/client';
import { MidenDAppPermission } from 'lib/adapter/types';

export class TridentWindowObject extends EventEmitter<TridentWalletEvents> implements TridentWallet {
  publicKey?: string | undefined;
  permission?: MidenDAppPermission | undefined;
  appName?: string | undefined;
  network?: WalletAdapterNetwork | undefined;
  private clearAccountChangeInterval?: () => void | undefined;

  async isAvailable(): Promise<boolean> {
    return await isAvailable();
  }

  async requestSend(transaction: MidenSendTransaction): Promise<{ transactionId?: string | undefined }> {
    const res = await requestSend(this.publicKey!, transaction);
    return { transactionId: res };
  }

  async requestConsume(transaction: MidenConsumeTransaction): Promise<{ transactionId?: string }> {
    const res = await requestConsume(this.publicKey!, transaction);
    return { transactionId: res };
  }

  async requestTransaction(transaction: MidenTransaction): Promise<{ transactionId?: string | undefined }> {
    const res = await requestTransaction(this.publicKey!, transaction);
    return { transactionId: res };
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
    this.publicKey = perm.publicKey;
    this.network = network;
    this.clearAccountChangeInterval = onPermissionChange((perm: MidenDAppPermission) => {
      this.emit('accountChange', perm);
    });
  }

  async disconnect(): Promise<void> {
    await requestDisconnect();
    this.publicKey = undefined;
    this.permission = undefined;
    this.clearAccountChangeInterval && this.clearAccountChangeInterval();
  }
}
