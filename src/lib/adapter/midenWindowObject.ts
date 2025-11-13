import { NoteFilterTypes } from '@demox-labs/miden-sdk';
import {
  AllowedPrivateData,
  EventEmitter,
  InputNoteDetails,
  MidenConsumeTransaction,
  MidenSendTransaction,
  MidenTransaction,
  PrivateDataPermission,
  SignKind,
  WalletAdapterNetwork
} from '@demox-labs/miden-wallet-adapter-base';
import { MidenWallet, MidenWalletEvents } from '@demox-labs/miden-wallet-adapter-miden';

import {
  importPrivateNote,
  isAvailable,
  onPermissionChange,
  requestAssets,
  requestConsumableNotes,
  requestConsume,
  requestDisconnect,
  requestPermission,
  requestPrivateNotes,
  requestSend,
  requestTransaction,
  signBytes
} from 'lib/adapter/client';
import { MidenDAppPermission } from 'lib/adapter/types';
import { b64ToU8, bytesToHex, u8ToB64 } from 'lib/shared/helpers';

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

  async requestPrivateNotes(
    notefilterType: NoteFilterTypes,
    noteIds?: string[]
  ): Promise<{ privateNotes: InputNoteDetails[] }> {
    const res = await requestPrivateNotes(this.accountId!, notefilterType, noteIds);
    return { privateNotes: res };
  }

  async signBytes(data: Uint8Array, kind: SignKind): Promise<{ signature: Uint8Array }> {
    console.log('signBytes', { data, kind });
    const publicKeyAsHex = bytesToHex(this.publicKey!);
    console.log('signBytes 2', { publicKeyAsHex });
    const messageAsB64 = u8ToB64(data);

    const signatureAsB64 = await signBytes(this.accountId!, publicKeyAsHex, messageAsB64, kind);
    const signatureAsU8Array = b64ToU8(signatureAsB64);
    return { signature: signatureAsU8Array };
  }

  async importPrivateNote(note: Uint8Array): Promise<{ noteId: string }> {
    const noteAsB64 = u8ToB64(note);

    const noteId = await importPrivateNote(this.accountId!, noteAsB64);
    return { noteId };
  }

  async requestAssets(): Promise<{ assets: any[] }> {
    const res = await requestAssets(this.accountId!);
    return { assets: res };
  }

  async requestConsumableNotes(): Promise<{ consumableNotes: InputNoteDetails[] }> {
    const res = await requestConsumableNotes(this.accountId!);
    return { consumableNotes: res };
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
