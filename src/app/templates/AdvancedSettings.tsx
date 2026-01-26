import React, { FC, useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';

import ToggleSwitch from 'app/atoms/ToggleSwitch';
import { Button, ButtonVariant } from 'components/Button';
import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { useAccount, useNetwork } from 'lib/miden/front';
import { accountIdStringToSdk, getBech32AddressFromAccountId } from 'lib/miden/sdk/helpers';

const AdvancedSettings: FC = () => {
  const { t } = useTranslation();
  const account = useAccount();
  const network = useNetwork();
  const [isSubmitting] = useState(false);

  const resync = () => {};

  const displayAddress = useMemo(
    () => (account.accountId ? getBech32AddressFromAccountId(accountIdStringToSdk(account.accountId), network.id) : ''),
    [account.accountId, network.id]
  );

  const addressShortened = useMemo(
    () => (displayAddress ? `${displayAddress.slice(0, 10)}...${displayAddress.slice(-6)} ` : ''),
    [displayAddress]
  );

  const listItems = useMemo(
    () => [
      {
        title: 'Auto Close Generating Transaction Page',
        subtitle: 'Configure auto close of the generating transaction page after the transaction is generated',
        value: false
      },
      {
        title: `Resync ${addressShortened}`,
        subtitle: 'Reset all of your history for this account and resync with the network.'
      }
    ],
    [addressShortened]
  );

  return (
    <div className="flex justify-center py-6">
      <div className="flex flex-col w-[328px] gap-y-4">
        {/* <Link to={'/settings/networks'}>
          <ListItem title="Networks" subtitle={uiNetwork?.name} iconRight={IconName.ChevronRight} />
        </Link>

        <hr className="bg-grey-100" /> */}
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
        <Button
          variant={ButtonVariant.Secondary}
          title={t(isSubmitting ? 'processing' : 'resync')}
          onClick={resync}
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
};

export default AdvancedSettings;
