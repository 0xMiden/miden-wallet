import React, { FC, useMemo } from 'react';

import { IconName } from 'app/icons/v2';
import AutoCloseSettings from 'app/templates/AutoCloseSettings';
import AutoConsumeSettings from 'app/templates/AutoConsumeSettings';
import { ListItem } from 'components/ListItem';
import { getFaucetIdSetting } from 'lib/miden/front';
import { Link } from 'lib/woozie';

const AdvancedSettings: FC = () => {
  const faucetId = getFaucetIdSetting();
  const faucetIdShortened = useMemo(() => `${faucetId.slice(0, 7)}...${faucetId.slice(-3)} `, [faucetId]);

  return (
    <div className="flex justify-center py-6">
      <div className="flex flex-col w-[328px] gap-y-4">
        <Link to={'settings/edit-miden-faucet-id'}>
          <ListItem title="Edit Miden Faucet ID" subtitle={faucetIdShortened} iconRight={IconName.ChevronRight} />
        </Link>
      </div>
    </div>
  );
};

export default AdvancedSettings;
