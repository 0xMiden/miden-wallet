import React, { FC, useMemo } from 'react';

import { ReactComponent as ContactBookIcon } from 'app/icons/contact-book.svg';
import { ReactComponent as ExtensionIcon } from 'app/icons/extension.svg';
import { ReactComponent as FileIcon } from 'app/icons/file.svg';
import PageLayout from 'app/layouts/PageLayout';
import Footer from 'app/layouts/PageLayout/Footer';
import About from 'app/templates/About';
import AddressBook from 'app/templates/AddressBook';
import MenuItem from 'app/templates/MenuItem';
import RevealSecret from 'app/templates/RevealSecret';
import { t } from 'lib/i18n/react';

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
  // {
  //   slug: 'general-settings',
  //   titleI18nKey: 'generalSettings',
  //   Icon: SettingsIcon,
  //   Component: GeneralSettings,
  //   descriptionI18nKey: 'generalSettingsDescription',
  //   testID: SettingsSelectors.GeneralButton,
  //   insertHR: false
  // },
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
  // {
  //   slug: 'reveal-seed-phrase',
  //   titleI18nKey: 'revealSeedPhrase',
  //   Icon: StickerIcon,
  //   Component: RevealSeedPhrase,
  //   descriptionI18nKey: 'revealSeedPhraseDescription',
  //   testID: SettingsSelectors.RevealSeedPhraseButton,
  //   insertHR: false
  // },
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
  {
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
  }
];

// TODO: Consider passing tabs in as a prop
const Settings: FC<SettingsProps> = ({ tabSlug }) => {
  const activeTab = useMemo(() => TABS.find(t => t.slug === tabSlug) || null, [tabSlug]);
  const listMenuItems = TABS.filter(t => t.slug !== 'networks');

  return (
    <PageLayout pageTitle={activeTab ? t(activeTab.titleI18nKey) : t('settings')}>
      <div className="pb-4" style={{ minHeight: '480px' }}>
        <div className="px-4">
          {activeTab ? (
            <activeTab.Component />
          ) : (
            <div className="flex flex-col w-full pt-2">
              {listMenuItems.map(({ slug, titleI18nKey, Icon, testID, insertHR, iconStyle }, i) => {
                const stroke = /*i === 0 ? 'none' :*/ '#000';
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
            </div>
          )}
        </div>
      </div>
      <div className="flex-none w-full absolute bottom-0">
        <Footer />
      </div>
    </PageLayout>
  );
};

export default Settings;
