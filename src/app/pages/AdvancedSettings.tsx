import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { IconName } from 'app/icons/v2';
import HashChip from 'app/templates/HashChip';
import { ListItem } from 'components/ListItem';
import { getFaucetIdSetting, useAccount } from 'lib/miden/front';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import { bytesToHex } from 'lib/shared/helpers';
import { Link } from 'lib/woozie';

const midenClient = await MidenClientInterface.create();

const AdvancedSettings: FC = () => {
  const walletAccount = useAccount();
  const faucetId = getFaucetIdSetting();
  const faucetIdShortened = useMemo(() => `${faucetId.slice(0, 7)}...${faucetId.slice(-3)} `, [faucetId]);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const fetchPublicKey = useCallback(async () => {
    const account = await midenClient.getAccount(walletAccount.publicKey);
    const publicKeys = account!.getPublicKeys();
    const publicKey = bytesToHex(publicKeys[0].serialize());
    setPublicKey(publicKey);
  }, [walletAccount.publicKey]);

  useEffect(() => {
    fetchPublicKey();
  }, [fetchPublicKey]);

  return (
    <div className="flex justify-center py-6">
      <div className="flex flex-col w-[328px] gap-y-4">
        <div className="flex flex-row gap-x-2 px-2 justify-between">
          <span className="text-black text-sm py-1">Account Public Key</span>
          <HashChip hash={publicKey || ''} small={false} trimHash={true} />
        </div>
        <Link to={'settings/edit-miden-faucet-id'}>
          <ListItem title="Edit Miden Faucet ID" subtitle={faucetIdShortened} iconRight={IconName.ChevronRight} />
        </Link>
      </div>
    </div>
  );
};

export default AdvancedSettings;
