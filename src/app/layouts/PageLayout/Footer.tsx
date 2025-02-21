import React, { FC } from 'react';

import { IconName } from 'app/icons/v2';
import { FooterIconWrapper } from 'components/FooterIconWrapper';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';

const Footer: FC = () => {
  const { trackEvent } = useAnalytics();
  const onSettingsClick = () => {
    trackEvent('Footer/Settings', AnalyticsEventCategory.ButtonPress, { type: 'settings' });
  };

  const onHomeClick = () => {
    trackEvent('Footer/Home', AnalyticsEventCategory.ButtonPress, { type: 'home' });
  };

  const onActivityClick = () => {
    trackEvent('Footer/Activity', AnalyticsEventCategory.ButtonPress, { type: 'activity' });
  };

  return (
    <footer className="w-full relative bg-white border-t rounded-b-3xl h-18 px-8 md:px-16 py-3 md:py-4">
      <div className="flex justify-between">
        <FooterIconWrapper icon={IconName.Home} iconFill={IconName.HomeFill} linkTo={'/'} onClick={onHomeClick} />
        <FooterIconWrapper
          icon={IconName.List}
          iconFill={IconName.List}
          linkTo={'/activity'}
          onClick={onActivityClick}
        />
        <FooterIconWrapper
          icon={IconName.Settings}
          iconFill={IconName.SettingsFill}
          linkTo={'/settings'}
          onClick={onSettingsClick}
        />
      </div>
    </footer>
  );
};

export default Footer;
