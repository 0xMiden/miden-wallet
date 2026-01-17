import { derivePath } from '@demox-labs/aleo-hd-key';
import { SecretKey, SigningInputs, Word } from '@demox-labs/miden-sdk';
import { SendTransaction, SignKind } from '@demox-labs/miden-wallet-adapter-base';
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
import { b64ToU8, u8ToB64 } from 'lib/shared/helpers';
import { WalletAccount, WalletSettings } from 'lib/shared/types';
import { WalletType } from 'screens/onboarding/types';

import { compareAccountIds } from '../activity/utils';
import { getBech32AddressFromAccountId } from '../sdk/helpers';
import { getMidenClient, withWasmClientLock } from '../sdk/miden-client';
import { MidenClientCreateOptions } from '../sdk/miden-client-interface';

const STORAGE_KEY_PREFIX = 'vault';
const DEFAULT_SETTINGS = {};

enum StorageEntity {
  Check = 'check',
  MigrationLevel = 'migration',
  Mnemonic = 'mnemonic',
  AccAuthSecretKey = 'accauthsecretkey',
  AccAuthPubKey = 'accauthpubkey',
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
const accPubKeyStrgKey = createDynamicStorageKey(StorageEntity.AccPubKey);
const accAuthSecretKeyStrgKey = createDynamicStorageKey(StorageEntity.AccAuthSecretKey);
const accAuthPubKeyStrgKey = createDynamicStorageKey(StorageEntity.AccAuthPubKey);
const currentAccPubKeyStrgKey = createStorageKey(StorageEntity.CurrentAccPubKey);
const accountsStrgKey = createStorageKey(StorageEntity.Accounts);
const settingsStrgKey = createStorageKey(StorageEntity.Settings);
const ownMnemonicStrgKey = createStorageKey(StorageEntity.OwnMnemonic);

const insertKeyCallbackWrpapper = (passKey: CryptoKey) => {
  return async (key: Uint8Array, secretKey: Uint8Array) => {
    const pubKeyHex = Buffer.from(key).toString('hex');
    const secretKeyHex = Buffer.from(secretKey).toString('hex');
    await encryptAndSaveMany(
      [
        [accAuthPubKeyStrgKey(pubKeyHex), pubKeyHex],
        [accAuthSecretKeyStrgKey(pubKeyHex), secretKeyHex]
      ],
      passKey
    );
  };
};
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
      const passKey = await Passworder.generateKey(password);

      if (!mnemonic) {
        mnemonic = Bip39.generateMnemonic(128);
      }

      // Clear storage before any inserts to avoid wiping newly inserted keys later
      await clearStorage();

      const options: MidenClientCreateOptions = {
        insertKeyCallback: insertKeyCallbackWrpapper(passKey)
      };
      const hdAccIndex = 0;
      const walletSeed = deriveClientSeed(WalletType.OnChain, mnemonic, 0);
      // Wrap WASM client operations in a lock to prevent concurrent access
      const accPublicKey = await withWasmClientLock(async () => {
        const midenClient = await getMidenClient(options);
        if (ownMnemonic) {
          try {
            return await midenClient.importPublicMidenWalletFromSeed(walletSeed);
          } catch (e) {
            // TODO: Need some way to propagate this up. Should we fail the entire process or just log it?
            console.error('Failed to import wallet from seed in spawn, creating new wallet instead', e);
            return await midenClient.createMidenWallet(WalletType.OnChain, walletSeed);
          }
        } else {
          return await midenClient.createMidenWallet(WalletType.OnChain, walletSeed);
        }
      });

      const initialAccount: WalletAccount = {
        publicKey: accPublicKey,
        name: 'Miden Account 1',
        isPublic: true,
        type: WalletType.OnChain,
        hdIndex: hdAccIndex
      };
      const newAccounts = [initialAccount];

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

  static async spawnFromMidenClient(password: string, mnemonic: string, walletAccounts: WalletAccount[]) {
    return withError('Failed to spawn from miden client', async () => {
      await clearStorage(false);

      const passKey = await Passworder.generateKey(password);
      // insert keys
      const options: MidenClientCreateOptions = {
        insertKeyCallback: insertKeyCallbackWrpapper(passKey)
      };
      // Wrap WASM client operations in a lock to prevent concurrent access
      await withWasmClientLock(async () => {
        const midenClient = await getMidenClient(options);
        const accountHeaders = await midenClient.getAccounts();

        // Have to do this sequentially else the wasm fails
        for (const accountHeader of accountHeaders) {
          const account = await midenClient.getAccount(getBech32AddressFromAccountId(accountHeader.id()));
          if (!account || account.isFaucet() || account.isNetwork()) {
            continue;
          }
          const walletAccount = walletAccounts.find(wa =>
            compareAccountIds(wa.publicKey, getBech32AddressFromAccountId(account.id()))
          );
          if (!walletAccount) {
            throw new PublicError('Account from Miden Client not found in provided wallet accounts');
          }
          const walletSeed = deriveClientSeed(walletAccount.type, mnemonic, walletAccount.hdIndex);
          const secretKey = SecretKey.rpoFalconWithRNG(walletSeed);
          await midenClient.webClient.addAccountSecretKeyToWebStore(secretKey);
        }
      });

      await encryptAndSaveMany(
        [
          [checkStrgKey, generateCheck()],
          [mnemonicStrgKey, mnemonic ?? ''],
          [accountsStrgKey, walletAccounts]
        ],
        passKey
      );
      await savePlain(currentAccPubKeyStrgKey, walletAccounts[0].publicKey);
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
      const options: MidenClientCreateOptions = {
        insertKeyCallback: insertKeyCallbackWrpapper(this.passKey)
      };

      // Wrap WASM client operations in a lock to prevent concurrent access
      const walletId = await withWasmClientLock(async () => {
        const midenClient = await getMidenClient(options);
        if (isOwnMnemonic && walletType === WalletType.OnChain) {
          try {
            return await midenClient.importPublicMidenWalletFromSeed(walletSeed);
          } catch (e) {
            console.warn('Failed to import wallet from seed, creating new wallet instead', e);
            return await midenClient.createMidenWallet(walletType, walletSeed);
          }
        } else {
          return await midenClient.createMidenWallet(walletType, walletSeed);
        }
      });

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

  async signData(publicKey: string, data: string, signKind: SignKind): Promise<string> {
    const secretKey = await fetchAndDecryptOneWithLegacyFallBack<string>(
      accAuthSecretKeyStrgKey(publicKey),
      this.passKey
    );
    const secretKeyBytes = new Uint8Array(Buffer.from(secretKey, 'hex'));
    const wasmSecretKey = SecretKey.deserialize(secretKeyBytes);

    const dataAsUint8Array = b64ToU8(data);

    let signature = null;
    switch (signKind) {
      case 'word':
        let word = Word.deserialize(dataAsUint8Array);
        signature = wasmSecretKey.sign(word);
        break;
      case 'signingInputs':
        let signingInputs = SigningInputs.deserialize(dataAsUint8Array);
        signature = wasmSecretKey.signData(signingInputs);
        break;
    }

    let signatureAsBytes = signature.serialize();
    return u8ToB64(signatureAsBytes);
  }

  async signTransaction(publicKey: string, signingInputs: string): Promise<string> {
    try {
      const secretKey = await fetchAndDecryptOneWithLegacyFallBack<string>(
        accAuthSecretKeyStrgKey(publicKey),
        this.passKey
      );
      let secretKeyBytes = new Uint8Array(Buffer.from(secretKey, 'hex'));
      const wasmSigningInputs = SigningInputs.deserialize(new Uint8Array(Buffer.from(signingInputs, 'hex')));
      const wasmSecretKey = SecretKey.deserialize(secretKeyBytes);
      const signature = wasmSecretKey.signData(wasmSigningInputs);
      return Buffer.from(signature.serialize()).toString('hex');
    } catch (e) {
      console.error('Error signing transaction in vault', e);
      throw e;
    }
  }

  async getAuthSecretKey(key: string) {
    const secretKey = await fetchAndDecryptOneWithLegacyFallBack<string>(accAuthSecretKeyStrgKey(key), this.passKey);
    return secretKey;
  }

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
