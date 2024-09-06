import React, { FC, useState } from 'react';

import { generateMnemonic } from 'bip39';

import PageLayout from 'app/layouts/PageLayout';
import { t } from 'lib/i18n/react';

import { useAleoClient } from '../../../lib/aleo/front';
import { NewSeedBackup } from './create/NewSeedBackup';
import { NewSeedVerify } from './create/NewSeedVerify';
import { LockedWalletExists } from './LockedWalletExists';
import { SetWalletPassword } from './SetWalletPassword';
import { Template } from './Template';

export const CreateWallet: FC = () => {
  const [seedPhrase, setSeedPhrase] = useState(() => generateMnemonic(128));
  const [backupCompleted, setBackupCompleted] = useState(false);
  const [verificationCompleted, setVerificationCompleted] = useState(false);

  const changeSeedPhrase = () => setSeedPhrase(generateMnemonic(128));

  return (
    <PageLayout pageTitle={t('createWallet')}>
      <LockedWalletExists locked={false} />
      {!backupCompleted && (
        <Template title={t('backupNewSeedPhrase')}>
          <NewSeedBackup
            seedPhrase={seedPhrase}
            onBackupComplete={() => setBackupCompleted(true)}
            changeSeedPhrase={changeSeedPhrase}
          />
        </Template>
      )}
      {backupCompleted && !verificationCompleted && (
        <Template title={t('verifySeedPhrase')}>
          <NewSeedVerify seedPhrase={seedPhrase} onVerificationComplete={() => setVerificationCompleted(true)} />
        </Template>
      )}
      {backupCompleted && verificationCompleted && <SetWalletPassword seedPhrase={seedPhrase} />}
    </PageLayout>
  );
};
