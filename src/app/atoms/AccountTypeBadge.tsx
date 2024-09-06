import React, { memo } from 'react';

import classNames from 'clsx';

import { getAccountBadgeTitle } from 'app/defaults';

type AccountTypeBadgeProps = {
  darkTheme?: boolean;
};

const AccountTypeBadge = memo<AccountTypeBadgeProps>(({ darkTheme = false }) => {
  const textAndBorderStyle = darkTheme ? '' : 'border-black text-black';

  return null;
});

export default AccountTypeBadge;
