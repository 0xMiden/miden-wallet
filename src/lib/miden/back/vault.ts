import * as Bip39 from 'bip39';

import { PublicError } from 'lib/miden/back/defaults';
import {
  encryptAndSaveMany,
  isStored,
  removeMany,
  getPlain,
  savePlain,
  fetchAndDecryptOneWithLegacyFallBack
} from 'lib/miden/back/safe-storage';
import * as Passworder from 'lib/miden/passworder';
import { clearStorage } from 'lib/miden/reset';

import { getMessage } from 'lib/i18n';

import { IRecord } from '../db/types';

const STORAGE_KEY_PREFIX = 'vault';
const DEFAULT_SETTINGS = {};

enum StorageEntity {
  Check = 'check',
  MigrationLevel = 'migration',
  Mnemonic = 'mnemonic',
  AccPrivKey = 'accprivkey',
  AccPubKey = 'accpubkey',
  AccViewKey = 'accviewkey',
  CurrentAccPubKey = 'curraccpubkey',
  Accounts = 'accounts',
  Settings = 'settings',
  OwnMnemonic = 'ownmnemonic',
  LegacyMigrationLevel = 'mgrnlvl'
}

const checkStrgKey = createStorageKey(StorageEntity.Check);
const mnemonicStrgKey = createStorageKey(StorageEntity.Mnemonic);
const accPrivKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPrivKey);
const accPubKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPubKey);
const accViewKeyStrgKey = createDynamicStorageKey(StorageEntity.AccViewKey);
const currentAccPubKeyStrgKey = createStorageKey(StorageEntity.CurrentAccPubKey);
const accountsStrgKey = createStorageKey(StorageEntity.Accounts);
const settingsStrgKey = createStorageKey(StorageEntity.Settings);
const ownMnemonicStrgKey = createStorageKey(StorageEntity.OwnMnemonic);

export class Vault {
  static async isExist() {
    const stored = await isStored(checkStrgKey);
    return stored;
  }

  static async setup(password: string) {
    return withError('Failed to unlock wallet', async () => {
      return new Vault();
    });
  }

  static async spawn(password: string, mnemonic?: string, ownMnemonic?: boolean) {}

  async fetchSettings() {
    return DEFAULT_SETTINGS;
  }

  async createHDAccount(name?: string, hdAccIndex?: number, chainId?: string) {}

  async importAccount(chainId: string, accPrivateKey: string) {
    const errMessage = 'Failed to import account.\nThis may happen because provided Key is invalid';
  }

  async importWatchOnlyAccount(chainId: string, viewKey: string) {
    const errMessage = 'Failed to import watch only account.';
  }

  async importMnemonicAccount(chainId: string, mnemonic: string, password?: string, derivationPath?: string) {}

  async importFundraiserAccount(chainId: string, email: string, password: string, mnemonic: string) {}

  async editAccountName(accPublicKey: string, name: string) {}

  async updateSettings() {}

  async authorize() {}

  async authorizeDeploy() {}

  async sign(accPublicKey: string, bytes: string) {}

  async decrypt(accPublicKey: string, cipherTexts: string[]) {}

  async decryptCipherText(accPublicKey: string, cipherText: string, tpk: string, index: number) {}

  async decryptCipherTextOrRecord() {}

  async revealViewKey(accPublicKey: string) {}

  async getCurrentAccount() {}

  async isOwnMnemonic() {
    const ownMnemonic = await getPlain<boolean>(ownMnemonicStrgKey);
    return ownMnemonic === undefined ? true : ownMnemonic;
  }

  async setCurrentAccount(accPublicKey: string) {}

  async getOwnedRecords() {}
}

/**
 * Misc
 */

function generateCheck() {
  return Bip39.generateMnemonic(128);
}

function concatAccount() {}

function getNewAccountName(templateI18nKey = 'defaultAccountName') {
  return getMessage(templateI18nKey);
}

async function getPublicKeyAndViewKey(chainId: string, privateKey: string) {}

async function seedToHDPrivateKey(seed: Buffer, hdAccIndex: number) {}

function getMainDerivationPath(accIndex: number) {
  return `m/44'/0'/${accIndex}'/0'`;
}

async function seedToPrivateKey(chainId: string, seed: Buffer) {}

function createStorageKey(id: StorageEntity) {
  return combineStorageKey(STORAGE_KEY_PREFIX, id);
}

function createDynamicStorageKey(id: StorageEntity) {
  const keyBase = combineStorageKey(STORAGE_KEY_PREFIX, id);
  return (...subKeys: (number | string)[]) => combineStorageKey(keyBase, ...subKeys);
}

function combineStorageKey(...parts: (string | number)[]) {
  return parts.join('_');
}

async function withError<T>(errMessage: string, factory: (doThrow: () => void) => Promise<T>) {
  try {
    return await factory(() => {
      throw new Error('<stub>');
    });
  } catch (err: any) {
    throw err instanceof PublicError ? err : new PublicError(errMessage);
  }
}
