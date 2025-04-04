import React, { FC } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import ColorIdenticon from 'app/atoms/ColorIdenticon';
import Name from 'app/atoms/Name';
import { openInFullPage, useAppEnv } from 'app/env';
import { ReactComponent as ChevronDownIcon } from 'app/icons/chevron-down.svg';
import { ReactComponent as MaximiseIcon } from 'app/icons/maximise.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import ContentContainer from 'app/layouts/ContentContainer';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { useMidenContext, useAccount } from 'lib/miden/front';
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
  const { popup } = useAppEnv();

  const onSettingsClick = () => {
    trackEvent(HeaderSelectors.Settings, AnalyticsEventCategory.ButtonPress, { type: 'settings' });
  };

  const handleMaximiseViewClick = () => {
    openInFullPage();
    if (popup) {
      window.close();
    }
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
                'transition ease-in-out duration-200',
                'cursor-pointer'
              )}
            >
              <ColorIdenticon publicKey={account.publicKey} size={20} />
              <div className="self-start flex overflow-x-hidden ml-2 leading-9">
                <Name className={classNames('font-bold', 'text-black', 'text-sm', 'opacity-90')}>{account.name}</Name>
                <ChevronDownIcon
                  className="ml-1 -mr-1 stroke-2"
                  style={{ height: 16, width: 'auto', marginTop: '10px' }}
                />
              </div>
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <NetworkSelect className="self-end" />
          {popup && (
            <Button
              className={classNames(
                'flex items-center justify-center',
                'rounded-md',
                'transition ease-in-out duration-200',
                'cursor-pointer',
                'opacity-90 hover:opacity-100',
                'h-8 w-8'
              )}
              onClick={handleMaximiseViewClick}
            >
              <MaximiseIcon className="h-5 w-6" style={{ stroke: '#000', strokeWidth: '2px' }} />
            </Button>
          )}
        </div>
      </div>
    </>
  );
};
