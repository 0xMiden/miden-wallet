import { useMidenClient } from 'app/hooks/useMidenClient';
import { useMidenContext } from 'lib/miden/front';
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
  const [dump, setDump] = useState('');

  const getDbDump = async () => {
    console.log('dumping...');
    const dbDump = await midenClient?.exportDb();

    // TODO: need to get the wallet password from the previous steps
    // const seedPhrase = await revealMnemonic(walletPassword);
    const seedPhrase = 'foo bar baz';

    const walletFile: EncryptedWalletFile = {
      seedPhrase,
      dbContent: dbDump
    };

    console.log({ walletFile });

    const encoder = new TextEncoder();
    const fileBytes = encoder.encode(JSON.stringify(walletFile));

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

    getDbDump();
  }, [midenClientLoading]);
  return <div>Creating file...</div>;
};

export default ExportFileComplete;
