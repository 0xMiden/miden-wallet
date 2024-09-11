import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import Name from 'app/atoms/Name';
import { useAllNetworks } from 'lib/miden/front';
import { T } from 'lib/i18n/react';

type NetworkBannerProps = {
  rpc: string;
  narrow?: boolean;
};

const NetworkBanner: FC<NetworkBannerProps> = ({ rpc, narrow = false }) => {
  const allNetworks = useAllNetworks();
  const knownNetwork = useMemo(() => allNetworks.find(n => 'n.rpcBaseURL' === rpc), [allNetworks, rpc]);

  return (
    <div className={classNames('w-full', narrow ? '-mt-1 mb-2' : 'mb-2', 'flex flex-col')}>
      <h2 className={classNames('leading-tight', 'flex flex-col')}>
        <T id="network">
          {message => (
            <span
              className={classNames(narrow ? 'mb-1' : 'mb-2', 'text-black font-medium')}
              style={{ fontSize: '14px', lineHeight: '20px' }}
            >
              {message}
            </span>
          )}
        </T>

        {knownNetwork ? (
          <div className={classNames('mb-1', 'flex items-center')}>
            <div
              className={classNames('mr-1 w-3 h-3', 'border border-primary-white', 'rounded-full', 'shadow-xs')}
              style={{
                backgroundColor: 'red'
              }}
            />

            <span className="text-black text-sm">{'knownNetwork.name'}</span>
          </div>
        ) : (
          <div className={classNames('w-full mb-1', 'flex items-center')}>
            <div
              className={classNames(
                'flex-shrink-0',
                'mr-1 w-3 h-3',
                'bg-red-500',
                'border border-primary-white',
                'rounded-full',
                'shadow-xs'
              )}
            />

            <T id="unknownNetwork">
              {message => (
                <>
                  <span className={classNames('flex-shrink-0 mr-2', 'text-xs font-medium uppercase text-red-500')}>
                    {message}
                  </span>

                  <Name className="text-xs font-mono italic text-gray-900" style={{ maxWidth: '15rem' }}>
                    {rpc}
                  </Name>
                </>
              )}
            </T>
          </div>
        )}
      </h2>
    </div>
  );
};

export default NetworkBanner;
