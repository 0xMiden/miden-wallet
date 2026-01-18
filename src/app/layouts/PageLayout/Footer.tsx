import React, { FC } from 'react';

import { IconName } from 'app/icons/v2';
import { FooterIconWrapper } from 'components/FooterIconWrapper';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { isMobile } from 'lib/platform';

interface FooterProps {
  historyBadge?: boolean;
}

const Footer: FC<FooterProps> = ({ historyBadge }) => {
  const { trackEvent } = useAnalytics();
  const onSettingsClick = () => {
    trackEvent('Footer/Settings', AnalyticsEventCategory.ButtonPress, { type: 'settings' });
  };

  const onBrowserClick = () => {
    trackEvent('Footer/Browser', AnalyticsEventCategory.ButtonPress, { type: 'browser' });
  };

  const onHomeClick = () => {
    trackEvent('Footer/Home', AnalyticsEventCategory.ButtonPress, { type: 'home' });
  };

  const onHistoryClick = () => {
    trackEvent('Footer/History', AnalyticsEventCategory.ButtonPress, { type: 'history' });
  };

  return (
    <footer className="w-full relative bg-white border-t rounded-b-3xl h-18 px-8 md:px-16 py-3 md:py-4">
      <div className="flex justify-between">
        <FooterIconWrapper icon={IconName.Home} iconFill={IconName.HomeFill} linkTo={'/'} onClick={onHomeClick} />
        <FooterIconWrapper
          icon={IconName.Time}
          iconFill={IconName.TimeFill}
          linkTo={'/history'}
          onClick={onHistoryClick}
          badge={historyBadge}
        />
        <FooterIconWrapper
          icon={IconName.Settings}
          iconFill={IconName.SettingsFill}
          linkTo={'/settings'}
          onClick={onSettingsClick}
        />
        {isMobile() && (
          <FooterIconWrapper
            icon={IconName.Globe}
            iconFill={IconName.GlobalFill}
            linkTo={'/browser'}
            onClick={onBrowserClick}
          />
        )}
      </div>
    </footer>
  );
};

export default Footer;
