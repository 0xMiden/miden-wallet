import React, { FC, HTMLAttributes, useCallback } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import Name from 'app/atoms/Name';
import { ReactComponent as SignalAltIcon } from 'app/icons/signal-alt.svg';
import { BLOCK_EXPLORERS, useAllNetworks, useBlockExplorer, useNetwork, useSetNetworkId } from 'lib/miden/front';
import { NETWORKS } from 'lib/miden/networks';
import { T } from 'lib/i18n/react';
import Popper from 'lib/ui/Popper';

import styles from './NetworkSelect.module.css';
import { NetworkSelectSelectors } from './NetworkSelect.selectors';

type NetworkSelectProps = HTMLAttributes<HTMLDivElement>;

const NetworkSelect: FC<NetworkSelectProps> = () => {
  const allNetworks = useAllNetworks();
  const network = useNetwork();
  const uiNetwork = NETWORKS.find(n => n.id === network.id)!;
  const setNetworkId = useSetNetworkId();

  const { setExplorerId } = useBlockExplorer();

  return (
    <Popper
      placement="bottom-end"
      strategy="fixed"
      popup={({ opened, setOpened }) => (
        <DropdownWrapper opened={opened} className="origin-top-right">
          <div className={styles.scroll}>
            <h2
              className={classNames(
                'mb-2',
                'border-b border-primary-500',
                'px-1 py-2',
                'flex items-center',
                'text-black font-medium text-sm text-center'
              )}
            >
              <SignalAltIcon className="w-auto h-4 mr-1 stroke-current" />
              <T id="networks">{networks => <>{networks}</>}</T>
            </h2>
          </div>
        </DropdownWrapper>
      )}
    >
      {({ ref, opened, toggleOpened }) => (
        <Button
          ref={ref}
          className={classNames(
            'mt-1',
            'text-black',
            'hover:bg-gray-900',
            'active:bg-gray-800',
            'transition ease-in-out duration-200',
            'px-3',
            opened ? 'opacity-100' : 'opacity-90 hover:opacity-100 focus:opacity-100',
            'flex items-center',
            'select-none'
          )}
          style={{
            border: '1px solid #969EAD',
            borderRadius: '20px',
            fontSize: '10px',
            lineHeight: '12px'
          }}
          // Disabled until we redo screen & add more networks
          // onClick={toggleOpened}
          testID={NetworkSelectSelectors.SelectedNetworkButton}
        >
          <div
            className={classNames('mr-2 -mt-0.5', 'rounded-full', 'shadow-xs')}
            style={{
              backgroundColor: '#00DB8C',
              width: '8px',
              height: '8px'
            }}
          />
          <Name style={{ maxWidth: '7rem' }}>{uiNetwork.name}</Name>
        </Button>
      )}
    </Popper>
  );
};

export default NetworkSelect;
