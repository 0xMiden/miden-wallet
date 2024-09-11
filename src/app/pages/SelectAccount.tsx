import React, { FC, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';

import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import ColorIdenticon from 'app/atoms/ColorIdenticon';
import Name from 'app/atoms/Name';
import { openInFullPage, useAppEnv } from 'app/env';
import { ReactComponent as AddIcon } from 'app/icons/add.svg';
import { ReactComponent as Checkmark } from 'app/icons/checkmark-alt.svg';
import { ReactComponent as DownloadIcon } from 'app/icons/download.svg';
import { ReactComponent as LockIcon } from 'app/icons/lock-alt.svg';
import { ReactComponent as MaximiseIcon } from 'app/icons/maximise.svg';
import { ReactComponent as PendingIcon } from 'app/icons/rotate.svg';
import PageLayout from 'app/layouts/PageLayout';
import MenuItem from 'app/templates/MenuItem';
import SearchField from 'app/templates/SearchField';
import { getEstimatedSyncPercentages } from 'lib/miden/activity/sync/sync-plan';
import { useAccount, useMidenClient } from 'lib/miden/front';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { t, T } from 'lib/i18n/react';
import { useRetryableSWR } from 'lib/swr';
import { navigate } from 'lib/woozie';

import { SelectAccountSelectors } from './SelectAccount.selectors';

type ExcludesFalse = <T>(x: T | false) => x is T;

const SelectAccount: FC = () => {
  const appEnv = useAppEnv();
  const { updateCurrentAccount } = useMidenClient();
  const account = useAccount();
  const { trackEvent } = useAnalytics();
  const [searchValue, setSearchValue] = useState('');

  // We may want to add this back if we get a design. Currently just hide it.
  // const isShowSearch = useMemo(() => allAccounts.length > 5, [allAccounts.length]);
  const isShowSearch = false;

  const handleMaximiseViewClick = useCallback(() => {
    openInFullPage();
    if (appEnv.popup) {
      window.close();
    }
  }, [appEnv.popup]);

  const actions = useMemo(() => {
    const items = [
      {
        key: 'create-account',
        Icon: AddIcon,
        i18nKey: 'createAccount',
        linkTo: '/create-account',
        includeHR: false,
        selector: SelectAccountSelectors.CreateAccountButton
      },
      {
        key: 'import-account',
        Icon: DownloadIcon,
        i18nKey: 'importAccount',
        linkTo: '/import-account',
        includeHR: false,
        iconStyle: { strokeWidth: 1 },
        selector: SelectAccountSelectors.ImportAccountButton
      },
      {
        key: 'maximise',
        Icon: MaximiseIcon,
        i18nKey: appEnv.fullPage ? 'openNewTab' : 'maximiseView',
        linkTo: '/fullpage.html',
        onClick: handleMaximiseViewClick,
        includeHR: false,
        linksOutsideOfWallet: true,
        selector: SelectAccountSelectors.MaximizeButton,
        fullPage: false
      },
      {
        key: 'lock',
        Icon: LockIcon,
        i18nKey: 'lock',
        linkTo: '/',
        onClick: () => {},
        includeHR: true,
        selector: SelectAccountSelectors.LockButton
      }
    ].filter(Boolean as any as ExcludesFalse);
    return items.filter((item, index) => {
      if (index === 0) {
        return true;
      }
      return !appEnv.fullPage || item.fullPage !== false;
    });
  }, [appEnv.fullPage, handleMaximiseViewClick]);

  return (
    <PageLayout
      pageTitle={
        <>
          <T id="accounts">{message => <span className="capitalize">{message}</span>}</T>
        </>
      }
    >
      <div className="flex justify-between w-full md:px-8 lg:px-16 m-auto">
        <div className={classNames('my-2', 'w-full')}>
          {isShowSearch && (
            <SearchField
              value={searchValue}
              className={classNames(
                'py-2 pl-8 pr-4',
                'bg-transparent',
                'focus:outline-none',
                'transition ease-in-out duration-200',
                'rounded rounded-b-none',
                'text-black text-sm leading-tight'
              )}
              placeholder={t('searchByName')}
              searchIconClassName="h-5 w-auto"
              searchIconWrapperClassName="px-2 text-black opacity-75"
              cleanButtonStyle={{ backgroundColor: 'transparent' }}
              cleanButtonIconStyle={{ stroke: 'white' }}
              onValueChange={setSearchValue}
            />
          )}
          <div
            className={classNames('overflow-y-auto', isShowSearch && 'border-t-0 rounded-t-none')}
            style={{ maxHeight: '12.5rem' }}
          >
            <div className="flex flex-col">
              <p className="text-center text-black text-sm p-10">
                <T id="noResults" />
              </p>
            </div>
          </div>
          <hr className="mt-4"></hr>
        </div>
      </div>

      <div className="flex flex-col w-full pt-2">
        {actions.map(
          ({ key, Icon, i18nKey, linkTo, onClick, selector, includeHR, iconStyle, linksOutsideOfWallet }) => {
            return (
              <MenuItem
                key={key}
                slug={linkTo || ''}
                onClick={onClick}
                titleI18nKey={i18nKey}
                Icon={Icon}
                testID={selector ?? ''}
                insertHR={includeHR}
                linksOutsideOfWallet={linksOutsideOfWallet ?? false}
                iconStyle={iconStyle}
              />
            );
          }
        )}
      </div>
    </PageLayout>
  );
};

export default SelectAccount;
