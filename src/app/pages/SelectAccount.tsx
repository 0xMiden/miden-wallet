import React, { FC, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import ColorIdenticon from 'app/atoms/ColorIdenticon';
import Name from 'app/atoms/Name';
import { openInFullPage, useAppEnv } from 'app/env';
import { ReactComponent as Checkmark } from 'app/icons/checkmark-alt.svg';
import { ReactComponent as MaximiseIcon } from 'app/icons/maximise.svg';
import PageLayout from 'app/layouts/PageLayout';
import MenuItem from 'app/templates/MenuItem';
import { Button, ButtonVariant } from 'components/Button';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { T } from 'lib/i18n/react';
import { useAccount, useMidenClient } from 'lib/miden/front';
import { navigate } from 'lib/woozie';

import { SelectAccountSelectors } from './SelectAccount.selectors';
import { Icon, IconName } from 'app/icons/v2';

type ExcludesFalse = <T>(x: T | false) => x is T;

const SelectAccount: FC = () => {
  const appEnv = useAppEnv();
  const { updateCurrentAccount } = useMidenClient();
  const account = useAccount();
  const { trackEvent } = useAnalytics();
  const accounts = [account];

  const handleMaximiseViewClick = useCallback(() => {
    openInFullPage();
    if (appEnv.popup) {
      window.close();
    }
  }, [appEnv.popup]);

  const onAddAccountClick = () => {};

  const actions = useMemo(() => {
    const items = [
      {
        key: 'maximise',
        Icon: MaximiseIcon,
        i18nKey: appEnv.fullPage ? 'openNewTab' : 'maximiseView',
        linkTo: '/fullpage.html',
        onClick: handleMaximiseViewClick,
        includeHR: false,
        linksOutsideOfWallet: true,
        selector: SelectAccountSelectors.MaximizeButton,
        fullPage: false,
        iconStyle: {}
      }
    ].filter(Boolean as any as ExcludesFalse);
    return items.filter((item, index) => {
      // if (index === 0) {
      //   return true;
      // }
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
      <div className="flex flex-1 justify-between w-full px-2 md:px-6">
        <div className={classNames('my-2', 'w-full')}>
          <div className={classNames('overflow-y-auto')} style={{ maxHeight: '12.5rem' }}>
            <div className="flex flex-col">
              {accounts.map(acc => {
                const selected = acc.publicKey === account.publicKey;
                const handleAccountClick = async () => {
                  if (!selected) {
                    trackEvent(SelectAccountSelectors.SelectAccountButton, AnalyticsEventCategory.ButtonPress);
                    await updateCurrentAccount(acc.publicKey);
                    navigate('/');
                  }
                };

                return (
                  <div
                    key={acc.publicKey}
                    className={classNames(
                      'flex w-full rounded-lg',
                      'overflow-hidden py-3 px-4',
                      'flex items-center',
                      'text-black text-shadow-black',
                      'transition ease-in-out duration-200',
                      'cursor-pointer',
                      'mb-1',
                      'hover:bg-gray-800 active:bg-gray-700'
                    )}
                    style={{ height: '64px' }}
                    onClick={handleAccountClick}
                  >
                    <ColorIdenticon publicKey={acc.publicKey} size={20} className="flex-shrink-0 shadow-xs-white" />

                    <div className="flex flex-col items-start ml-2">
                      <div className="flex flex-col text-left">
                        <Name
                          className="font-medium leading-none"
                          style={{ paddingBottom: 3, fontSize: '14px', lineHeight: '20px' }}
                        >
                          {acc.name}
                        </Name>
                      </div>
                    </div>
                    <div className="flex flex-col flex-grow items-end">
                      <Icon
                        name={IconName.CheckboxCircleFill}
                        size="md"
                        className={`mr-1`}
                        fill={selected ? 'black' : 'transparent'}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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

      <div className="flex flex-col w-full p-6 md:px-8 m-auto">
        <Button title={'Add Account'} variant={ButtonVariant.Secondary} onClick={onAddAccountClick} />
      </div>
    </PageLayout>
  );
};

export default SelectAccount;
