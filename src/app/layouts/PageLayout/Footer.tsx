import React, { FC } from 'react';

import { ReactComponent as HomeIcon } from 'app/icons/home.svg';
import { ReactComponent as ListIcon } from 'app/icons/list.svg';
import { ReactComponent as PictureIcon } from 'app/icons/picture.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { Link } from 'lib/woozie';

const ICON_SIZE = '18px';

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

  const onNFTsClick = () => {
    trackEvent('Footer/Nfts', AnalyticsEventCategory.ButtonPress, { type: 'nfts' });
  };

  return (
    <footer className="w-full relative bg-white border-t rounded-b-lg h-18 px-8 md:px-16 py-2">
      <div className="flex justify-between">
        <Link to={'/'} onClick={onHomeClick}>
          <div className="flex flex-col items-center">
            <HomeIcon
              height={ICON_SIZE}
              width={ICON_SIZE}
              style={{
                cursor: 'pointer'
              }}
            />
            <span className={'text-sm text-center text-black pt-2'}>Home</span>
          </div>
        </Link>
        <Link to={'/activity'} onClick={onActivityClick}>
          <div className="flex flex-col items-center">
            <ListIcon
              height={ICON_SIZE}
              width={ICON_SIZE}
              style={{
                cursor: 'pointer'
              }}
            />
            <span className={'text-sm text-center text-black pt-2'}>Activities</span>
          </div>
        </Link>
        <Link to={'/nfts'} onClick={onNFTsClick}>
          <div className="flex flex-col items-center">
            <PictureIcon
              height={ICON_SIZE}
              width={ICON_SIZE}
              style={{
                cursor: 'pointer'
              }}
            />
            <span className={'text-sm text-center text-black pt-2'}>NFTs</span>
          </div>
        </Link>
        <Link to={'/settings'} onClick={onSettingsClick}>
          <div className="flex flex-col items-center">
            <SettingsIcon
              height={ICON_SIZE}
              width={ICON_SIZE}
              style={{
                cursor: 'pointer'
              }}
            />
            <span className={'text-sm text-center text-black pt-2'}>Settings</span>
          </div>
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
