import React, { useCallback, useEffect } from 'react';

import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { useAppEnv } from 'app/env';
import { Icon, IconName } from 'app/icons/v2';
import { Alert, AlertVariant } from 'components/Alert';
import { Button, ButtonVariant } from 'components/Button';
import { useMidenContext } from 'lib/miden/front';
import { deriveKey, encrypt, encryptJson, generateKey, generateSalt } from 'lib/miden/passworder';
import { exportDb } from 'lib/miden/repo';
import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';
import { isMobile } from 'lib/platform';
import { EncryptedWalletFile, ENCRYPTED_WALLET_FILE_PASSWORD_CHECK, DecryptedWalletFile } from 'screens/shared';

export interface ExportFileCompleteProps {
  onGoBack: () => void;
  onDone: () => void;
  filePassword: string;
  fileName: string;
  walletPassword: string;
}

const EXTENSION = '.json';

const ExportFileComplete: React.FC<ExportFileCompleteProps> = ({
  filePassword,
  fileName,
  walletPassword,
  onDone,
  onGoBack
}) => {
  const { t } = useTranslation();
  const { revealMnemonic, accounts, revealPrivateKey } = useMidenContext();
  const { fullPage } = useAppEnv();

  const getExportFile = useCallback(async () => {
    // Wrap WASM client operations in a lock to prevent concurrent access
    const midenClientDbDump = await withWasmClientLock(async () => {
      const midenClient = await getMidenClient();
      return midenClient.exportDb();
    });
    const walletDbDump = await exportDb();

    const seedPhrase = await revealMnemonic(walletPassword);
    const secretKeysForImportedAccounts: Record<string, string> = {};
    await withWasmClientLock(async () => {
      const midenClient = await getMidenClient();
      for (const account of accounts) {
        if (account.hdIndex === -1) {
          const pubKey = await midenClient.getAccountPkcByPublicKey(account.publicKey);
          const sk = await revealPrivateKey(pubKey, walletPassword);
          secretKeysForImportedAccounts[account.publicKey] = sk;
        }
      }
    });

    const filePayload: DecryptedWalletFile = {
      seedPhrase,
      midenClientDbContent: midenClientDbDump,
      walletDbContent: walletDbDump,
      accounts,
      secretKeysForImportedAccounts
    };
    const salt = generateSalt();
    const passKey = await generateKey(filePassword);
    const derivedKey = await deriveKey(passKey, salt);

    const encryptedPayload = await encryptJson(filePayload, derivedKey);
    const encryptedPasswordCheck = await encrypt(ENCRYPTED_WALLET_FILE_PASSWORD_CHECK, derivedKey);
    const encryptedWalletFile: EncryptedWalletFile = {
      dt: encryptedPayload.dt,
      iv: encryptedPayload.iv,
      salt,
      encryptedPasswordCheck
    };

    const fileContent = JSON.stringify(encryptedWalletFile);
    const fullFileName = `${fileName}${EXTENSION}`;

    if (isMobile()) {
      // On mobile, write to cache directory and share
      try {
        const result = await Filesystem.writeFile({
          path: fullFileName,
          data: fileContent,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });

        await Share.share({
          title: fullFileName,
          url: result.uri,
          dialogTitle: t('saveEncryptedWalletFile')
        });
      } catch (error) {
        console.error('Failed to export file on mobile:', error);
      }
    } else {
      // On desktop, use standard download approach
      const encoder = new TextEncoder();
      const fileBytes = encoder.encode(fileContent);
      const blob = new Blob([new Uint8Array(fileBytes)], { type: 'application/json' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fullFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [walletPassword, filePassword, fileName, revealMnemonic, t, accounts, revealPrivateKey]);

  useEffect(() => {
    getExportFile();
  }, [getExportFile]);

  return (
    <div className="flex flex-col justify-between md:w-[460px] mx-auto items-center">
      <div className="flex flex-col w-full items-center p-4 justify-center flex-1">
        <div className="w-40 aspect-square flex items-center justify-center">
          <Icon name={IconName.Success} size="3xl" />
        </div>
        <div className="flex flex-col items-center mt-8 max-w-sm">
          <h1 className="font-semibold text-2xl lh-title text-center">{t('encryptedWalletFileExported')}</h1>
          <p className="mt-2 text-sm text-center lh-title">{t('encryptedWalletFileExportedDescription')}</p>
          <Alert
            variant={AlertVariant.Warning}
            className={classNames('mt-4 text-left', fullPage ? 'text-sm' : 'text-xs')}
            title={
              <>
                <p className="font-medium">{t('doNotShareEncryptedWalletFile')}</p>
                <p>{t('doNotShareEncryptedWalletFileDescription')}</p>
              </>
            }
          />
        </div>
      </div>
      <div className="w-full pb-4 px-4">
        <Button className="w-full justify-center" title={t('done')} variant={ButtonVariant.Primary} onClick={onDone} />
      </div>
    </div>
  );
};

export default ExportFileComplete;
