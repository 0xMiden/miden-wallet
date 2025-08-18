import React from 'react';

import classNames from 'clsx';

import { Icon, IconName } from 'app/icons/v2';
import { Link, useLocation } from 'lib/woozie';
import colors from 'utils/tailwind-colors';

export interface FooterIconWrapperProps {
  linkTo: string;
  onClick: () => void;
  icon: IconName;
  iconFill: IconName;
  badge?: boolean;
}

export const FooterIconWrapper: React.FC<FooterIconWrapperProps> = ({ linkTo, onClick, icon, iconFill, badge }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const pathSegments = currentPath.split('/');
  const currentPathSegment = pathSegments[1];
  const active =
    currentPathSegment === linkTo.replace('/', '') ||
    (currentPathSegment === 'activity-details' && linkTo === '/activity');

  return (
    <Link to={linkTo} onClick={onClick}>
      <div
        className={classNames(
          'flex relative flex-col items-center p-3 rounded-full hover:bg-grey-25',
          active ? 'bg-grey-25' : ''
        )}
      >
        <Icon name={active ? iconFill : icon} size="sm" fill={active ? colors.primary[600] : 'black'} />
        {badge && (
          <div
            className={classNames(
              'absolute top-[30%] left-[70%] -translate-x-1/2 -translate-y-1/2',
              'flex items-center justify-center',
              'w-4 h-4 bg-red-500 rounded-full',
              'border-2 border-white'
            )}
          />
        )}
      </div>
    </Link>
  );
};
