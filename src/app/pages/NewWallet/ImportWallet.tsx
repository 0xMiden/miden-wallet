import React, { FC, useState } from 'react';

import PageLayout from 'app/layouts/PageLayout';
import { t } from 'lib/i18n/react';
import { useMidenContext } from 'lib/miden/front';

import { ImportFromSeedPhrase } from './import/ImportFromSeedPhrase';
import { LockedWalletExists } from './LockedWalletExists';
import { SetWalletPassword } from './SetWalletPassword';

interface ImportWalletProps {
  tabSlug?: string;
}

export const ImportWallet: FC<ImportWalletProps> = ({ tabSlug = 'seed-phrase' }) => {
  const { locked } = useMidenContext();

  const [seedPhrase, setSeedPhrase] = useState('');
  const [keystorePassword] = useState('');
  const [isSeedEntered, setIsSeedEntered] = useState(false);

  const isImportFromSeedPhrase = tabSlug === 'seed-phrase';

  return (
    <PageLayout pageTitle={t('importWallet')} contentContainerStyle={{ padding: 0 }}>
      <div className="mx-12">
        <LockedWalletExists locked={locked} />
      </div>
      {isImportFromSeedPhrase ? (
        isSeedEntered ? (
          <SetWalletPassword ownMnemonic seedPhrase={seedPhrase} keystorePassword={keystorePassword} />
        ) : (
          <ImportFromSeedPhrase
            seedPhrase={seedPhrase}
            setSeedPhrase={setSeedPhrase}
            setIsSeedEntered={setIsSeedEntered}
          />
        )
      ) : (
        <SetWalletPassword ownMnemonic seedPhrase={seedPhrase} keystorePassword={keystorePassword} />
      )}
    </PageLayout>
  );
};
