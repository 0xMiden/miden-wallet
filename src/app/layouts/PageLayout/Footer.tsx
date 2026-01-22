import React, { FC } from 'react';

import { IconName } from 'app/icons/v2';
import { FooterIconWrapper } from 'components/FooterIconWrapper';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { isDesktop, isMobile } from 'lib/platform';

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

  // Remove rounded corners on mobile so footer extends edge-to-edge
  // On mobile, use safe area for bottom padding (replaces py-3 bottom portion)
  const roundedClass = isMobile() ? '' : 'rounded-b-3xl';
  const paddingClass = isMobile() ? 'pt-3 md:py-4' : 'py-3 md:py-4';
  const mobileBottomPadding = isMobile() ? { paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' } : {};

  return (
    <footer
      className={`w-full relative bg-white border-t ${roundedClass} h-18 px-8 md:px-16 ${paddingClass}`}
      style={mobileBottomPadding}
    >
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
        {(isMobile() || isDesktop()) && (
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
