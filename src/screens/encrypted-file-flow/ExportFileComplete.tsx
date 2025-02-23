import { useMidenClient } from 'app/hooks/useMidenClient';
import { useMidenContext } from 'lib/miden/front';
import { decryptJson, deriveKey, encrypt, encryptJson, generateKey, generateSalt } from 'lib/miden/passworder';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import React, { FC, useEffect, useState } from 'react';
import { EncryptedWalletFile } from 'screens/shared';

export interface ExportFileCompleteProps {
  onGoBack: () => void;
  filePassword: string;
  fileName: string;
  walletPassword: string;
}

const ExportFileComplete: React.FC<ExportFileCompleteProps> = ({ filePassword, fileName, walletPassword }) => {
  const { midenClient, midenClientLoading } = useMidenClient();
  const { revealMnemonic } = useMidenContext();

  const getExportFile = async () => {
    console.log('dumping...');
    const dbDump = await midenClient?.exportDb();

    const seedPhrase = await revealMnemonic(walletPassword);

    const walletFile: EncryptedWalletFile = {
      seedPhrase,
      dbContent: dbDump
    };

    console.log({ filePassword, walletPassword });

    const salt = generateSalt();
    const passKey = await generateKey(filePassword);
    const derivedKey = await deriveKey(passKey, salt);

    const encryptedFile = await encryptJson(walletFile, derivedKey);

    const encoder = new TextEncoder();
    const fileBytes = encoder.encode(
      JSON.stringify({
        dt: encryptedFile.dt,
        iv: encryptedFile.iv,
        salt
      })
    );

    console.log('testing something rq');

    const decrypted = await decryptJson(encryptedFile, derivedKey);

    const dataIntegrity = JSON.stringify(walletFile) === JSON.stringify(decrypted);

    console.log('Data Integrity Check:', dataIntegrity ? 'PASS ✅' : 'FAIL ❌');

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

    console.log('dump complete');
  };

  useEffect(() => {
    if (midenClientLoading) return;

    getExportFile();
  }, [midenClientLoading]);

  return <div>Creating file...</div>;
};

export default ExportFileComplete;
