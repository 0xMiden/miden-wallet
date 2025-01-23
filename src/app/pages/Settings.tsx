import React, { FC, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import { openInFullPage, useAppEnv } from 'app/env';
import { ReactComponent as ContactBookIcon } from 'app/icons/contact-book.svg';
import { ReactComponent as ExtensionIcon } from 'app/icons/extension.svg';
import { ReactComponent as FileIcon } from 'app/icons/file.svg';
import { ReactComponent as MaximiseIcon } from 'app/icons/maximise.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import PageLayout from 'app/layouts/PageLayout';
import Footer from 'app/layouts/PageLayout/Footer';
import About from 'app/templates/About';
import AddressBook from 'app/templates/AddressBook';
import EditMidenFaucetId from 'app/templates/EditMidenFaucetId';
import GeneralSettings from 'app/templates/GeneralSettings';
import MenuItem from 'app/templates/MenuItem';
import RevealSecret from 'app/templates/RevealSecret';
import { t } from 'lib/i18n/react';
import { useAccount } from 'lib/miden/front';

import NetworksSettings from './Networks';
import { SettingsSelectors } from './Settings.selectors';

type SettingsProps = {
  tabSlug?: string | null;
};

// const RevealViewKey: FC = () => <RevealSecret reveal="view-key" />;
// const RevealPrivateKey: FC = () => <RevealSecret reveal="private-key" />;
const RevealSeedPhrase: FC = () => <RevealSecret reveal="seed-phrase" />;

type Tab = {
  slug: string;
  titleI18nKey: string;
  Icon: React.FC<{ style?: React.CSSProperties }>;
  Component: React.FC;
  descriptionI18nKey: string;
  testID?: SettingsSelectors;
  insertHR: boolean;
  iconStyle?: React.CSSProperties;
};

const TABS: Tab[] = [
  {
    slug: 'general-settings',
    titleI18nKey: 'generalSettings',
    Icon: SettingsIcon,
    Component: GeneralSettings,
    descriptionI18nKey: 'generalSettingsDescription',
    testID: SettingsSelectors.GeneralButton,
    insertHR: false
  },
  {
    slug: 'address-book',
    titleI18nKey: 'addressBook',
    Icon: ContactBookIcon,
    Component: AddressBook,
    descriptionI18nKey: 'addressBookDescription',
    testID: SettingsSelectors.AddressBookButton,
    insertHR: false
  },
  // {
  //   slug: 'reveal-view-key',
  //   titleI18nKey: 'revealViewKey',
  //   Icon: KeyIcon,
  //   Component: RevealViewKey,
  //   descriptionI18nKey: 'revealViewKeyDescription',
  //   testID: SettingsSelectors.RevealViewKeyButton,
  //   insertHR: true,
  //   iconStyle: { stroke: '#000', strokeWidth: '1px' }
  // },
  // {
  //   slug: 'reveal-private-key',
  //   titleI18nKey: 'revealPrivateKey',
  //   Icon: KeyIcon,
  //   Component: RevealPrivateKey,
  //   descriptionI18nKey: 'revealPrivateKeyDescription',
  //   testID: SettingsSelectors.RevealPrivateKeyButton,
  //   insertHR: false,
  //   iconStyle: { stroke: '#000', strokeWidth: '1px' }
  // },
  {
    slug: 'reveal-seed-phrase',
    titleI18nKey: 'revealSeedPhrase',
    Icon: SettingsIcon,
    Component: RevealSeedPhrase,
    descriptionI18nKey: 'revealSeedPhraseDescription',
    testID: SettingsSelectors.RevealSeedPhraseButton,
    insertHR: false
  },
  {
    slug: 'edit-miden-faucet-id',
    titleI18nKey: 'editMidenFaucetId',
    Icon: SettingsIcon,
    Component: EditMidenFaucetId,
    descriptionI18nKey: 'editMidenFaucetIdDescription',
    testID: SettingsSelectors.EditMidenFaucetButton,
    insertHR: false
  }
  // {
  //   slug: 'file-settings',
  //   titleI18nKey: 'fileSettings',
  //   Icon: FileIcon,
  //   Component: FileSettings,
  //   descriptionI18nKey: 'fileSettingsDescription',
  //   testID: SettingsSelectors.FileSettingsButton,
  //   insertHR: false
  // },
  // {
  //   slug: 'advanced-settings',
  //   titleI18nKey: 'advancedSettings',
  //   Icon: ToolIcon,
  //   Component: AdvancedSettings,
  //   descriptionI18nKey: 'advancedSettingsDescription',
  //   testID: SettingsSelectors.AdvancedSettingsButton,
  //   insertHR: false
  // },
  // {
  //   slug: 'remove-account',
  //   titleI18nKey: 'removeAccount',
  //   Icon: MinusIcon,
  //   Component: RemoveAccount,
  //   descriptionI18nKey: 'removeAccountDescription',
  //   testID: SettingsSelectors.RemoveAccountButton,
  //   insertHR: true
  // },
  /* {
    slug: 'reveal-seed-phrase',
    titleI18nKey: 'exportWalletFile',
    Icon: FileIcon,
    Component: RevealSeedPhrase,
    descriptionI18nKey: 'revealSeedPhraseDescription',
    testID: SettingsSelectors.RevealSeedPhraseButton,
    insertHR: false,
    iconStyle: { stroke: '#000', strokeWidth: '0px' }
  },
  {
    slug: 'about',
    titleI18nKey: 'about',
    Icon: ExtensionIcon,
    Component: About,
    descriptionI18nKey: 'aboutDescription',
    testID: SettingsSelectors.AboutButton,
    insertHR: false
  },
  {
    slug: 'networks',
    titleI18nKey: 'networks',
    Icon: ExtensionIcon,
    Component: NetworksSettings,
    descriptionI18nKey: 'networkDescription',
    testID: SettingsSelectors.NetworksButton,
    insertHR: false
  } */
];

// TODO: Consider passing tabs in as a prop
const Settings: FC<SettingsProps> = ({ tabSlug }) => {
  const activeTab = useMemo(() => TABS.find(t => t.slug === tabSlug) || null, [tabSlug]);
  let listMenuItems = TABS.filter(t => t.slug !== 'networks');
  const { fullPage, popup } = useAppEnv();
  const account = useAccount();
  if (!account.isPublic) {
    listMenuItems = listMenuItems.filter(t => t.slug !== 'reveal-seed-phrase');
  }

  const handleMaximiseViewClick = useCallback(() => {
    openInFullPage();
    if (popup) {
      window.close();
    }
  }, [popup]);

  return (
    <PageLayout pageTitle={activeTab ? t(activeTab.titleI18nKey) : t('settings')}>
      <div className={classNames('flex flex-col flex-1', activeTab ? '' : 'pb-4')} style={{ minHeight: '458px' }}>
        <div className="px-4 overflow-y-auto" style={fullPage ? {} : { maxHeight: '458px' }}>
          {activeTab ? (
            <activeTab.Component />
          ) : (
            <div className="flex flex-col w-full pt-2">
              {listMenuItems.map(({ slug, titleI18nKey, Icon, testID, insertHR, iconStyle }, i) => {
                const stroke = i === 0 ? 'none' : '#000';
                const style = iconStyle ?? { stroke, strokeWidth: '2px' };
                const linkTo = `/settings/${slug}`;
                return (
                  <MenuItem
                    key={titleI18nKey}
                    slug={linkTo}
                    titleI18nKey={titleI18nKey}
                    Icon={Icon}
                    iconStyle={style}
                    testID={testID?.toString() || ''}
                    insertHR={insertHR}
                    linksOutsideOfWallet={false}
                  />
                );
              })}
              <MenuItem
                key={'maximise'}
                Icon={MaximiseIcon}
                titleI18nKey={fullPage ? 'openNewTab' : 'maximiseView'}
                slug={'/fullpage.html'}
                onClick={handleMaximiseViewClick}
                insertHR={false}
                linksOutsideOfWallet={true}
                testID={''}
              />
            </div>
          )}
        </div>
      </div>
      {/* <Footer /> */}
    </PageLayout>
  );
};

export default Settings;
