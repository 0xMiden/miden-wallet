import React from 'react';

import { Icon, IconName, IconSize } from 'app/icons/v2';

export const IconOrComponent = ({
  icon,
  color,
  size = 'md'
}: {
  icon: React.ReactNode | IconName;
  color: string;
  size?: IconSize;
}) => {
  if (Object.values(IconName).includes(icon as IconName)) {
    return <Icon name={icon as IconName} fill={color} className="w-6 h-6" size={size} />;
  }

  return <>{icon}</>;
};
