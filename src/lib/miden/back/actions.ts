import browser from 'webextension-polyfill';

import { toFront, store, inited, locked, unlocked, withInited, withUnlocked } from 'lib/miden/back/store';
import { Vault } from 'lib/miden/back/vault';
import { IRecord } from 'lib/miden/db/types';
import { createQueue } from 'lib/queue';

import { getCurrentAleoNetwork } from './safe-network';

const ACCOUNT_NAME_PATTERN = /^.{0,16}$/;

const enqueueDApp = createQueue();
const enqueueUnlock = createQueue();

export async function init() {
  const vaultExist = await Vault.isExist();
  inited(vaultExist);
}

export async function getFrontState() {}

export async function isDAppEnabled() {
  return true;
}

export function registerNewWallet(password: string, mnemonic?: string, ownMnemonic?: boolean) {
  return withInited(async () => {
    await Vault.spawn(password, mnemonic, ownMnemonic);
    await unlock(password);
  });
}

export function lock() {
  return withInited(async () => {
    locked();
  });
}

export function unlock(password: string) {}

export function updateCurrentAccount(accPublicKey: string) {}

export function getCurrentAccount() {
  return withUnlocked(async ({ vault }) => {
    const currentAccount = await vault.getCurrentAccount();
    return currentAccount;
  });
}

export function createHDAccount(name?: string) {}

export function decryptCiphertexts(accPublicKey: string, cipherTexts: string[]) {}

export function revealViewKey(accPublicKey: string, password: string) {}

export function revealMnemonic(password: string) {}

export function revealPrivateKey(accPublicKey: string, password: string) {}

export function revealPublicKey(accPublicKey: string) {}

export function removeAccount(accPublicKey: string, password: string) {}

export function editAccount(accPublicKey: string, name: string) {}

export function importAccount(privateKey: string, encPassword?: string) {}

export function importMnemonicAccount(mnemonic: string, password?: string, derivationPath?: string) {}

export function importFundraiserAccount(email: string, password: string, mnemonic: string) {}

export function importWatchOnlyAccount(viewKey: string) {}

export function updateSettings() {}

export function authorize(
  accPublicKey: string,
  program: string,
  functionName: string,
  inputs: string[],
  feeCredits: number,
  feeRecord?: string,
  imports?: { [key: string]: string }
) {}

export function authorizeDeploy(accPublicKey: string, deployment: string, feeCredits: number, feeRecord?: string) {}

export function getAllDAppSessions() {}

export function removeDAppSession(origin: string) {}

export const getOwnedRecords = async (accPublicKey: string) => {};
