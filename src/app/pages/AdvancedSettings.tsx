import React, { FC, useMemo } from 'react';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { IconName } from 'app/icons/v2';
import { ListItem } from 'components/ListItem';
import { getFaucetIdSetting } from 'lib/miden/front';
import { Link } from 'lib/woozie';

const AdvancedSettings: FC = () => {
  const faucetId = getFaucetIdSetting();
  const faucetIdShortened = useMemo(() => `${faucetId.slice(0, 7)}...${faucetId.slice(-3)} `, [faucetId]);

  const listItems = useMemo(
    () => [
      {
        title: 'Auto Close Generating Transaction Page',
        subtitle: 'Configure auto close of the generating transaction page after the transaction is generated',
        value: false
      }
    ],
    []
  );

  return (
    <div className="flex justify-center py-6">
      <div className="flex flex-col w-[328px] gap-y-4">
        <Link to={'settings/edit-miden-faucet-id'}>
          <ListItem title="Edit Miden Faucet ID" subtitle={faucetIdShortened} iconRight={IconName.ChevronRight} />
        </Link>

        <hr className="bg-grey-100" />
        <div className="mt-2 flex flex-col">
          <ul className="flex flex-col gap-y-4">
            {listItems.map((item, index) => (
              <li className="flex gap-x-2" key={`list-item-${index}`}>
                <div className="flex flex-col gap-y-2">
                  <p className="font-medium text-sm text-black">{item.title}</p>
                  <p className="text-xs text-black">{item.subtitle}</p>
                </div>
                {item.value !== undefined && (
                  <div>
                    <ToggleSwitch
                      checked={true}
                      // onChange={handlePopupModeChange}
                      name="popupEnabled"
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
