import { useMidenClient } from 'app/hooks/useMidenClient';
import { useMidenContext } from 'lib/miden/front';
import { decryptJson, deriveKey, encrypt, encryptJson, generateKey, generateSalt } from 'lib/miden/passworder';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import React, { FC, useEffect, useState } from 'react';
import { EncryptedWalletFile, ENCRYPTED_WALLET_FILE_PASSWORD_CHECK, DecryptedWalletFile } from 'screens/shared';
import classNames from 'clsx';
import { Icon, IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { t } from 'lib/i18n/react';

export interface ExportFileCompleteProps {
  onGoBack: () => void;
  onDone: () => void;
  filePassword: string;
  fileName: string;
  walletPassword: string;
}

const ExportFileComplete: React.FC<ExportFileCompleteProps> = ({ filePassword, fileName, walletPassword, onDone }) => {
  const { midenClient, midenClientLoading } = useMidenClient();
  const { revealMnemonic } = useMidenContext();

  const getExportFile = async () => {
    const dbDump = await midenClient?.exportDb();

    const seedPhrase = await revealMnemonic(walletPassword);

    const filePayload: DecryptedWalletFile = {
      seedPhrase,
      dbContent: dbDump
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

    const blob = new Blob([fileBytes], { type: 'application/json' });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;

    // Append the anchor to the document
    document.body.appendChild(a);

    // Programmatically click the anchor to trigger the download
    a.click();

    // Remove the anchor from the document
    document.body.removeChild(a);

    // Revoke the object URL to free up resources
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (midenClientLoading) return;

    getExportFile();
  }, [midenClientLoading]);

  return (
    <div className="flex-1 flex flex-col justify-between md:w-[460px] md:mx-auto items-center">
      <div
        className={classNames(
          'w-40 aspect-square flex items-center justify-center',
          'rounded-full bg-gradient-to-t from-white to-[#F9F9F9]'
        )}
      >
        <Icon name={IconName.CheckboxCircleFill} size="xxl" />
      </div>
      <div className="flex flex-col items-center">
        <h1 className="font-semibold text-2xl lh-title">{'Encrypted Wallet File Exported'}</h1>
        <p className="text-base text-center lh-title">
          {
            'Your encrypted wallet file has been downloaded. Keep it and your password safe, as losing them means losing access to your wallet.'
          }
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-y-4 w-64">
        <Button title={t('done')} variant={ButtonVariant.Primary} onClick={onDone} />
      </div>
    </div>
  );
};

export default ExportFileComplete;
