import React, { FC } from 'react';

import { Icon, IconName } from 'app/icons/v2';
import { CardItem } from 'components/CardItem';
import { setAccountCreationMetadata } from 'lib/aleo/activity/sync/account-creation';
import { useAccount, useNetwork, useSetNetworkId } from 'lib/aleo/front';
import { NETWORKS } from 'lib/aleo/networks';

const ListGroups = [
  {
    id: 'devnet',
    title: 'Devnet',
    items: [NETWORKS[1]]
  },
  {
    id: 'testnet',
    title: 'Testnet',
    items: [NETWORKS[0], NETWORKS[1]]
  }
];

const NetworksSettings: FC = () => {
  const setNetworkId = useSetNetworkId();
  const network = useNetwork();
  const account = useAccount();

  const onNetworkSelect = async (networkId: string) => {
    setNetworkId(networkId);

    // If this is account's first time on the network, setting the block creation height and recordId to 0
    await setAccountCreationMetadata(account.publicKey, 0);
  };

  return (
    <div className="flex justify-center py-6">
      <div className="flex flex-col w-[328px] gap-y-4">
        {ListGroups.map(group => (
          <div key={group.id} className="flex flex-col gap-y-2">
            <p className="text-xs text-grey-600">{group.title}</p>
            <ul className="flex flex-col gap-y-4">
              {group.items.map((item, index) => (
                <CardItem
                  key={'item.id'}
                  title={'item.description'}
                  iconLeft={
                    <div className="bg-black rounded-full w-8 h-8 flex items-center justify-center p-2">
                      <Icon name={IconName.Aleo} fill="white" />
                    </div>
                  }
                  iconRight={true ? IconName.CheckboxCircleFill : null}
                  onClick={() => {}}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworksSettings;
