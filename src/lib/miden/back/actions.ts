import { MidenDAppMessageType, MidenDAppRequest, MidenDAppResponse } from 'lib/adapter/types';
import {
  toFront,
  store,
  inited,
  locked,
  unlocked,
  withInited,
  withUnlocked,
  settingsUpdated,
  accountsUpdated,
  currentAccountUpdated
} from 'lib/miden/back/store';
import { Vault } from 'lib/miden/back/vault';
import { createQueue } from 'lib/queue';
import { WalletSettings, WalletState } from 'lib/shared/types';
import { WalletType } from 'screens/onboarding/types';

import {
  getAllDApps,
  getCurrentPermission,
  removeDApp,
  requestDisconnect,
  requestPermission,
  requestSendTransaction,
  requestTransaction,
  requestConsumeTransaction
} from './dapp';

const ACCOUNT_NAME_PATTERN = /^.{0,16}$/;

const enqueueDApp = createQueue();
const enqueueUnlock = createQueue();

export async function init() {
  const vaultExist = await Vault.isExist();
  inited(vaultExist);
}

export async function getFrontState(): Promise<WalletState> {
  const state = store.getState();
  if (state.inited) {
    return toFront(state);
  } else {
    await new Promise(r => setTimeout(r, 10));
    return getFrontState();
  }
}

export async function isDAppEnabled() {
  return true;
}

export function registerNewWallet(password: string, mnemonic?: string, ownMnemonic?: boolean) {
  return withInited(async () => {
    await Vault.spawn(password, mnemonic, ownMnemonic);
    await unlock(password);
  });
}

export function registerImportedWallet(password: string, mnemonic: string) {
  return withInited(async () => {
    await Vault.spawnFromMidenClient(password, mnemonic);
    await unlock(password);
  });
}

export function lock() {
  return withInited(async () => {
    locked();
  });
}

export function unlock(password: string) {
  return withInited(() =>
    enqueueUnlock(async () => {
      const vault = await Vault.setup(password);
      const accounts = await vault.fetchAccounts();
      const settings = await vault.fetchSettings();
      const currentAccount = await vault.getCurrentAccount();
      const ownMnemonic = await vault.isOwnMnemonic();
      unlocked({ vault, accounts, settings, currentAccount, ownMnemonic });
    })
  );
}

export function updateCurrentAccount(accPublicKey: string) {
  return withUnlocked(async ({ vault }) => {
    const currentAccount = await vault.setCurrentAccount(accPublicKey);
    currentAccountUpdated(currentAccount);
  });
}

export function getCurrentAccount() {
  return withUnlocked(async ({ vault }) => {
    const currentAccount = await vault.getCurrentAccount();
    return currentAccount;
  });
}

export function createHDAccount(walletType: WalletType, name?: string) {
  return withUnlocked(async ({ vault }) => {
    if (name) {
      name = name.trim();
      if (!ACCOUNT_NAME_PATTERN.test(name)) {
        throw new Error('Invalid name. It should be: 1-16 characters, without special');
      }
    }

    const accounts = await vault.createHDAccount(walletType, name);
    accountsUpdated({ accounts });
  });
}

export function decryptCiphertexts(accPublicKey: string, cipherTexts: string[]) {}

export function revealViewKey(accPublicKey: string, password: string) {}

export function revealMnemonic(password: string) {
  return withUnlocked(() => Vault.revealMnemonic(password));
}

export function revealPrivateKey(accPublicKey: string, password: string) {}

export function revealPublicKey(accPublicKey: string) {}

export function removeAccount(accPublicKey: string, password: string) {}

export function editAccount(accPublicKey: string, name: string) {
  console.log({ accPublicKey, name });
  return withUnlocked(async ({ vault }) => {
    name = name.trim();
    if (!ACCOUNT_NAME_PATTERN.test(name)) {
      throw new Error('Invalid name. It should be: 1-16 characters, without special');
    }

    const updatedAccounts = await vault.editAccountName(accPublicKey, name);
    console.log({ updatedAccounts });
    accountsUpdated(updatedAccounts);
  });
}

export function importAccount(privateKey: string, encPassword?: string) {}

export function importMnemonicAccount(mnemonic: string, password?: string, derivationPath?: string) {}

export function importFundraiserAccount(email: string, password: string, mnemonic: string) {}

export function importWatchOnlyAccount(viewKey: string) {}

export function updateSettings(settings: Partial<WalletSettings>) {
  return withUnlocked(async ({ vault }) => {
    const updatedSettings = await vault.updateSettings(settings);
    // createCustomNetworksSnapshot(updatedSettings);
    settingsUpdated(updatedSettings);
  });
}

export function authorizeDeploy(accPublicKey: string, deployment: string, feeCredits: number, feeRecord?: string) {}

export function getAllDAppSessions() {
  return getAllDApps();
}

export function removeDAppSession(origin: string) {
  return withUnlocked(async ({ vault }) => {
    const currentAccountPublicKey = await Vault.getCurrentAccountPublicKey();
    return removeDApp(origin, currentAccountPublicKey!);
  });
}

export async function processDApp(origin: string, req: MidenDAppRequest): Promise<MidenDAppResponse | void> {
  switch (req?.type) {
    case MidenDAppMessageType.GetCurrentPermissionRequest:
      return withInited(() => getCurrentPermission(origin));

    case MidenDAppMessageType.PermissionRequest:
      return withInited(() => enqueueDApp(() => requestPermission(origin, req)));

    case MidenDAppMessageType.DisconnectRequest:
      return withInited(() => enqueueDApp(() => requestDisconnect(origin, req)));

    case MidenDAppMessageType.TransactionRequest:
      return withInited(() => enqueueDApp(() => requestTransaction(origin, req)));

    case MidenDAppMessageType.SendTransactionRequest:
      return withInited(() => enqueueDApp(() => requestSendTransaction(origin, req)));

    case MidenDAppMessageType.ConsumeRequest:
      return withInited(() => enqueueDApp(() => requestConsumeTransaction(origin, req)));
  }
}

// async function createCustomNetworksSnapshot(settings: WalletSettings) {
//   try {
//     if (settings.customNetworks) {
//       await browser.storage.local.set({
//         custom_networks_snapshot: settings.customNetworks
//       });
//     }
//   } catch {}
// }
