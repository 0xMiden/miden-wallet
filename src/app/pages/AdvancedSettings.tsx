import React, { FC, useCallback, useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import useMidenFaucetId from 'app/hooks/useMidenFaucetId';
import { IconName } from 'app/icons/v2';
import HashChip from 'app/templates/HashChip';
import { ListItem } from 'components/ListItem';
import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { useAccount, useNetwork } from 'lib/miden/front';
import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';
import { bytesToHex } from 'lib/shared/helpers';
import { Link } from 'lib/woozie';
import { truncateAddress } from 'utils/string';

const AdvancedSettings: FC = () => {
  const { t } = useTranslation();
  const walletAccount = useAccount();
  const faucetId = useMidenFaucetId();
  const faucetIdShortened = truncateAddress(faucetId, false);
  const network = useNetwork();
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const fetchPublicKey = useCallback(async () => {
    // Wrap WASM client operations in a lock to prevent concurrent access
    const key = await withWasmClientLock(async () => {
      const midenClient = await getMidenClient({ network: network.id as MIDEN_NETWORK_NAME });
      const account = await midenClient.getAccount(walletAccount.accountId);
      const publicKeys = account!.getPublicKeyCommitments();
      return bytesToHex(publicKeys[0].serialize());
    });
    setPublicKey(key);
  }, [walletAccount.accountId, network]);

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
