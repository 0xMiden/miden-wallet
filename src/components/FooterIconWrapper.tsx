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
}

export const FooterIconWrapper: React.FC<FooterIconWrapperProps> = ({ linkTo, onClick, icon, iconFill }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const pathSegments = currentPath.split('/');
  const currentPathSegment = pathSegments[1];
  const active = currentPathSegment === linkTo.replace('/', '');

  return (
    <Link to={linkTo} onClick={onClick}>
      <div
        className={classNames(
          'flex flex-col items-center p-3 rounded-full hover:bg-grey-25',
          active ? 'bg-grey-25' : ''
        )}
      >
        <Icon name={active ? iconFill : icon} size="sm" fill={active ? colors.primary[600] : 'black'} />
      </div>
    </Link>
  );
};
