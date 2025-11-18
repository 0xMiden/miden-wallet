import React, { useCallback, useEffect } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { useAppEnv } from 'app/env';
import { useMidenClient } from 'app/hooks/useMidenClient';
import { Icon, IconName } from 'app/icons/v2';
import { Alert, AlertVariant } from 'components/Alert';
import { Button, ButtonVariant } from 'components/Button';
import { useMidenContext } from 'lib/miden/front';
import { deriveKey, encrypt, encryptJson, generateKey, generateSalt } from 'lib/miden/passworder';
import { exportDb } from 'lib/miden/repo';
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
  const { midenClient, midenClientLoading } = useMidenClient();
  const { revealMnemonic } = useMidenContext();
  const { fullPage } = useAppEnv();

  const getExportFile = useCallback(async () => {
    if (!midenClient) return;

    const midenClientDbDump = await midenClient.exportDb();
    const walletDbDump = await exportDb();

    const seedPhrase = await revealMnemonic(walletPassword);

    const filePayload: DecryptedWalletFile = {
      seedPhrase,
      midenClientDbContent: midenClientDbDump,
      walletDbContent: walletDbDump
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

    const encoder = new TextEncoder();
    // TODO: Type the top level json fields here
    const fileBytes = encoder.encode(JSON.stringify(encryptedWalletFile));

    const blob = new Blob([new Uint8Array(fileBytes)], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}${EXTENSION}`;

    // Append the anchor to the document
    document.body.appendChild(a);

    // Programmatically click the anchor to trigger the download
    a.click();

    // Remove the anchor from the document
    document.body.removeChild(a);

    // Revoke the object URL to free up resources
    URL.revokeObjectURL(url);
  }, [midenClient, walletPassword, filePassword, fileName, revealMnemonic]);

  useEffect(() => {
    if (midenClientLoading || !midenClient) return;

    getExportFile();
  }, [getExportFile, midenClient, midenClientLoading]);

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
