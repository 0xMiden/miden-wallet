import { derivePath } from '@demox-labs/aleo-hd-key';
import { SendTransaction } from '@demox-labs/miden-wallet-adapter-base';
import * as Bip39 from 'bip39';

import { getMessage } from 'lib/i18n';
import { PublicError } from 'lib/miden/back/defaults';
import {
  encryptAndSaveMany,
  fetchAndDecryptOneWithLegacyFallBack,
  getPlain,
  isStored,
  savePlain
} from 'lib/miden/back/safe-storage';
import * as Passworder from 'lib/miden/passworder';
import { clearStorage } from 'lib/miden/reset';
import { WalletAccount, WalletSettings } from 'lib/shared/types';
import { WalletType } from 'screens/onboarding/types';

import { MidenClientInterface } from '../sdk/miden-client-interface';

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
  constructor(private passKey: CryptoKey) {}

  static async isExist() {
    const stored = await isStored(checkStrgKey);
    return stored;
  }

  static async setup(password: string) {
    return withError('Failed to unlock wallet', async () => {
      const passKey = await Vault.toValidPassKey(password);
      return new Vault(passKey);
    });
  }

  static async spawn(password: string, mnemonic?: string, ownMnemonic?: boolean) {
    return withError('Failed to create wallet', async () => {
      if (!mnemonic) {
        mnemonic = Bip39.generateMnemonic(128);
      }

      const midenClient = await MidenClientInterface.create();
      const hdAccIndex = 0;
      const walletSeed = deriveClientSeed(WalletType.OnChain, mnemonic, 0);

      console.log('created miden client');

      let accPublicKey;
      if (ownMnemonic) {
        try {
          accPublicKey = await midenClient.importPublicMidenWalletFromSeed(walletSeed);
        } catch (e) {
          // TODO: Need some way to propagate this up. Should we fail the entire process or just log it?
          console.error('Failed to import wallet from seed in spawn, creating new wallet instead', e);
          accPublicKey = await midenClient.createMidenWallet(WalletType.OnChain, walletSeed);
        }
      } else {
        accPublicKey = await midenClient.createMidenWallet(WalletType.OnChain, walletSeed);
      }

      console.log({ accPublicKey });

      const initialAccount: WalletAccount = {
        publicKey: accPublicKey,
        name: 'Miden Account 1',
        isPublic: true,
        type: WalletType.OnChain,
        hdIndex: hdAccIndex
      };
      const newAccounts = [initialAccount];
      const passKey = await Passworder.generateKey(password);

      console.log({ passKey });

      await clearStorage();
      await encryptAndSaveMany(
        [
          [checkStrgKey, generateCheck()],
          [mnemonicStrgKey, mnemonic],
          [accPubKeyStrgKey(accPublicKey), accPublicKey],
          [accountsStrgKey, newAccounts]
        ],
        passKey
      );
      await savePlain(currentAccPubKeyStrgKey, accPublicKey);
      await savePlain(ownMnemonicStrgKey, ownMnemonic ?? false);
    });
  }

  static async spawnFromMidenClient(password: string, mnemonic: string) {
    return withError('Failed to spawn from miden client', async () => {
      const midenClient = await MidenClientInterface.create();
      const accountHeaders = await midenClient.getAccounts();
      const accounts = [];

      // Have to do this sequentially else the wasm fails
      for (const accountHeader of accountHeaders) {
        const account = await midenClient.getAccount(accountHeader.id().toString());
        accounts.push(account);
      }

      const newAccounts = [];
      for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i];
        if (acc) {
          newAccounts.push({
            publicKey: acc.id().toString(),
            name: 'Miden Account ' + (i + 1),
            isPublic: acc.isPublic(),
            type: WalletType.OnChain
          });
        }
      }
      const passKey = await Passworder.generateKey(password);

      await clearStorage();
      await encryptAndSaveMany(
        [
          [checkStrgKey, generateCheck()],
          [mnemonicStrgKey, mnemonic ?? ''],
          [accountsStrgKey, newAccounts]
        ],
        passKey
      );
      await savePlain(currentAccPubKeyStrgKey, newAccounts[0].publicKey);
      await savePlain(ownMnemonicStrgKey, true);
    });
  }

  static async getCurrentAccountPublicKey() {
    return await getPlain<string>(currentAccPubKeyStrgKey);
  }

  async fetchSettings() {
    return DEFAULT_SETTINGS;
  }

  async createHDAccount(walletType: WalletType, name?: string): Promise<WalletAccount[]> {
    return withError('Failed to create account', async () => {
      const [mnemonic, allAccounts] = await Promise.all([
        fetchAndDecryptOneWithLegacyFallBack<string>(mnemonicStrgKey, this.passKey),
        this.fetchAccounts()
      ]);

      const isOwnMnemonic = await this.isOwnMnemonic();

      let hdAccIndex;
      let accounts;
      if (walletType === WalletType.OnChain) {
        accounts = allAccounts.filter(acc => acc.isPublic);
      } else {
        accounts = allAccounts.filter(acc => !acc.isPublic);
      }
      hdAccIndex = accounts.length;

      const walletSeed = deriveClientSeed(walletType, mnemonic, hdAccIndex);

      const midenClient = await MidenClientInterface.create();
      let walletId;
      if (isOwnMnemonic && walletType === WalletType.OnChain) {
        try {
          walletId = await midenClient.importPublicMidenWalletFromSeed(walletSeed);
        } catch (e) {
          console.warn('Failed to import wallet from seed, creating new wallet instead', e);
          walletId = await midenClient.createMidenWallet(walletType, walletSeed);
        }
      } else {
        walletId = await midenClient.createMidenWallet(walletType, walletSeed);
      }

      const accName = name || getNewAccountName(allAccounts);

      const newAccount: WalletAccount = {
        type: walletType,
        name: accName,
        publicKey: walletId,
        isPublic: walletType === WalletType.OnChain,
        hdIndex: hdAccIndex
      };

      const newAllAcounts = concatAccount(allAccounts, newAccount);

      await encryptAndSaveMany(
        [
          [accPubKeyStrgKey(walletId), walletId],
          // private key and view key were here from aleo, but removed since we dont store pk and vk isnt a thing (yet)
          [accountsStrgKey, newAllAcounts]
        ],
        this.passKey
      );

      return newAllAcounts;
    });
  }

  async importAccount(chainId: string, accPrivateKey: string) {
    const errMessage = 'Failed to import account.\nThis may happen because provided Key is invalid';
  }

  async importWatchOnlyAccount(chainId: string, viewKey: string) {
    const errMessage = 'Failed to import watch only account.';
  }

  async importMnemonicAccount(chainId: string, mnemonic: string, password?: string, derivationPath?: string) {}

  async importFundraiserAccount(chainId: string, email: string, password: string, mnemonic: string) {}

  async editAccountName(accPublicKey: string, name: string) {
    return withError('Failed to edit account name', async () => {
      const allAccounts = await this.fetchAccounts();
      if (!allAccounts.some(acc => acc.publicKey === accPublicKey)) {
        throw new PublicError('Account not found');
      }

      if (allAccounts.some(acc => acc.publicKey !== accPublicKey && acc.name === name)) {
        throw new PublicError('Account with same name already exist');
      }

      const newAllAccounts = allAccounts.map(acc => (acc.publicKey === accPublicKey ? { ...acc, name } : acc));
      await encryptAndSaveMany([[accountsStrgKey, newAllAccounts]], this.passKey);

      const currentAccount = await this.getCurrentAccount();
      return { accounts: newAllAccounts, currentAccount };
    });
  }

  async updateSettings(settings: Partial<WalletSettings>) {
    return withError('Failed to update settings', async () => {
      const current = await this.fetchSettings();
      const newSettings = { ...current, ...settings };
      await encryptAndSaveMany([[settingsStrgKey, newSettings]], this.passKey);
      return newSettings;
    });
  }

  async authorize(sendTransaction: SendTransaction) {}

  async authorizeDeploy() {}

  async sign(accPublicKey: string, bytes: string) {}

  async decrypt(accPublicKey: string, cipherTexts: string[]) {}

  async decryptCipherText(accPublicKey: string, cipherText: string, tpk: string, index: number) {}

  async decryptCipherTextOrRecord() {}

  async revealViewKey(accPublicKey: string) {}

  static async revealMnemonic(password: string) {
    const passKey = await Vault.toValidPassKey(password);
    return withError('Failed to reveal seed phrase', async () => {
      const mnemonic = await fetchAndDecryptOneWithLegacyFallBack<string>(mnemonicStrgKey, passKey);
      const mnemonicPattern = /^(\b\w+\b\s?){12}$/;
      if (!mnemonicPattern.test(mnemonic)) {
        throw new PublicError('Mnemonic does not match the expected pattern');
      }
      return mnemonic;
    });
  }

  async getCurrentAccount() {
    const currAccountPubkey = await getPlain<string>(currentAccPubKeyStrgKey);
    const allAccounts = await this.fetchAccounts();
    if (allAccounts.length < 1) {
      throw new PublicError('No accounts created yet.');
    }
    let currentAccount = allAccounts.find(acc => acc.publicKey === currAccountPubkey);
    if (!currentAccount) {
      currentAccount = await this.setCurrentAccount(allAccounts[0].publicKey);
    }
    return currentAccount;
  }

  async isOwnMnemonic() {
    const ownMnemonic = await getPlain<boolean>(ownMnemonicStrgKey);
    return ownMnemonic === undefined ? true : ownMnemonic;
  }

  async setCurrentAccount(accPublicKey: string) {
    return withError('Failed to set current account', async () => {
      const allAccounts = await this.fetchAccounts();
      const newCurrentAccount = allAccounts.find(acc => acc.publicKey === accPublicKey);
      if (!newCurrentAccount) {
        throw new PublicError('Account not found');
      }
      await savePlain(currentAccPubKeyStrgKey, accPublicKey);

      return newCurrentAccount;
    });
  }

  async getOwnedRecords() {}

  async fetchAccounts() {
    const accounts = await fetchAndDecryptOneWithLegacyFallBack<WalletAccount[]>(accountsStrgKey, this.passKey);
    if (!Array.isArray(accounts)) {
      throw new PublicError('Accounts not found');
    }
    return accounts;
  }

  private static toValidPassKey(password: string) {
    return withError('Invalid password', async doThrow => {
      const passKey = await Passworder.generateKey(password);
      try {
        await fetchAndDecryptOneWithLegacyFallBack<any>(checkStrgKey, passKey);
      } catch (err: any) {
        doThrow();
      }
      return passKey;
    });
  }
}

/**
 * Misc
 */

function generateCheck() {
  return Bip39.generateMnemonic(128);
}

function concatAccount(current: WalletAccount[], newOne: WalletAccount) {
  if (current.every(a => a.publicKey !== newOne.publicKey)) {
    return [...current, newOne];
  }

  throw new PublicError('Account already exists');
}

function getNewAccountName(allAccounts: WalletAccount[], templateI18nKey = 'defaultAccountName') {
  return getMessage(templateI18nKey, String(allAccounts.length + 1));
}

async function getPublicKeyAndViewKey(privateKey: string) {}

function getMainDerivationPath(walletType: WalletType, accIndex: number) {
  let walletTypeIndex = 0;
  if (walletType === WalletType.OnChain) {
    walletTypeIndex = 0;
  } else if (walletType === WalletType.OffChain) {
    walletTypeIndex = 1;
  } else {
    throw new Error('Invalid wallet type');
  }
  return `m/44'/0'/${walletTypeIndex}'/${accIndex}'`;
}

async function seedToPrivateKey(chainId: string, seed: Buffer) {}

function deriveClientSeed(walletType: WalletType, mnemonic: string, hdAccIndex: number) {
  const seed = Bip39.mnemonicToSeedSync(mnemonic);
  const path = getMainDerivationPath(walletType, hdAccIndex);
  const { seed: childSeed } = derivePath(path, seed.toString('hex'));
  return new Uint8Array(childSeed);
}

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
