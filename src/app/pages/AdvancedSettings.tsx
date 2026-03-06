import React, { FC, useCallback, useEffect, useState } from 'react';

import { useMiden } from '@miden-sdk/react';
import { useTranslation } from 'react-i18next';

import useMidenFaucetId from 'app/hooks/useMidenFaucetId';
import { IconName } from 'app/icons/v2';
import HashChip from 'app/templates/HashChip';
import { ListItem } from 'components/ListItem';
import { useAccount } from 'lib/miden/front';
import { Link } from 'lib/woozie';
import { truncateAddress } from 'utils/string';

const AdvancedSettings: FC = () => {
  const { t } = useTranslation();
  const walletAccount = useAccount();
  const faucetId = useMidenFaucetId();
  const faucetIdShortened = truncateAddress(faucetId, false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const { client, isReady, runExclusive } = useMiden();

  const fetchPublicKey = useCallback(async () => {
    if (!client || !isReady) return;

    try {
      const key = await runExclusive(async () => {
        const account = await (client as any).getAccount(walletAccount.publicKey);
        if (!account) return null;
        const publicKeyCommitments = account.getPublicKeyCommitments();
        if (publicKeyCommitments.length === 0) return null;
        return publicKeyCommitments[0].toHex().slice(2);
      });
      setPublicKey(key);
    } catch (err) {
      console.error('[AdvancedSettings] Failed to fetch public key:', err);
    }
  }, [walletAccount.publicKey, client, isReady, runExclusive]);

  useEffect(() => {
    fetchPublicKey();
  }, [fetchPublicKey]);

  return (
    <div className="flex justify-center py-6">
      <div className="flex flex-col w-[328px] gap-y-4">
        <div className="flex flex-row gap-x-2 px-2 justify-between">
          <span className="text-black text-sm py-1">{t('accountPublicKey')}</span>
          <HashChip hash={publicKey || ''} small={false} trimHash={true} />
        </div>
        <Link to={'settings/edit-miden-faucet-id'}>
          <ListItem title={t('editMidenFaucetId')} subtitle={faucetIdShortened} iconRight={IconName.ChevronRight} />
        </Link>
      </div>
    </div>
  );
};

export default AdvancedSettings;
