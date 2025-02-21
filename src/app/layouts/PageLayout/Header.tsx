import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import ColorIdenticon from 'app/atoms/ColorIdenticon';
import Name from 'app/atoms/Name';
import { useAppEnv } from 'app/env';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import ContentContainer from 'app/layouts/ContentContainer';
import { useMidenContext, useAccount } from 'lib/miden/front';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { Link } from 'lib/woozie';

import { HeaderSelectors } from './Header.selectors';
import NetworkSelect from './Header/NetworkSelect';

const Header: FC = () => {
  const appEnv = useAppEnv();

  const isGeneratingUrl = window.location.href.search('generating-transaction') > -1;

  return (
    <header className={classNames('mx-4', appEnv.fullPage && '')}>
      <ContentContainer className="py-5">
        <div>
          <div className="flex w-full">{!isGeneratingUrl && <Control />}</div>
        </div>
      </ContentContainer>
    </header>
  );
};

export default Header;

const Control: FC = () => {
  const account = useAccount();
  const { trackEvent } = useAnalytics();

  const onSettingsClick = () => {
    trackEvent(HeaderSelectors.Settings, AnalyticsEventCategory.ButtonPress, { type: 'settings' });
  };

  return (
    <>
      <div className={classNames('flex', 'justify-between', 'w-full')}>
        <div className={classNames('flex', 'justify-start')}>
          <Link to={'/select-account'} testID={HeaderSelectors.AccountDropdown}>
            <Button
              className={classNames(
                'flex-shrink-0 flex',
                'rounded-md',
                'transition ease-in-out duration-200'
                // 'cursor-pointer'
              )}
              disabled={true}
            >
              <ColorIdenticon publicKey={account.publicKey} size={20} />
              <div className="self-start flex overflow-x-hidden ml-2 leading-9">
                <Name className={classNames('font-bold', 'text-black', 'text-sm', 'opacity-90')}>{account.name}</Name>
                {/* <ChevronDownIcon
                  className="ml-1 -mr-1 stroke-2"
                  style={{ height: 16, width: 'auto', marginTop: '10px' }}
                /> */}
              </div>
            </Button>
          </Link>
        </div>
        <div className="flex">
          <NetworkSelect className="self-end" />
        </div>
      </div>
    </>
  );
};
