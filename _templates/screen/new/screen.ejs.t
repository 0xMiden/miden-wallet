---
to: src/screens/<%=flow%>/<%=name%>.tsx
---
import React, { HTMLAttributes } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

export interface <%=name%>ScreenProps extends HTMLAttributes<HTMLDivElement> {}

export const <%=name%>Screen: React.FC<<%=name%>ScreenProps> = ({ className, ...props }) => {
  const { t } = useTranslation();

  return (
    <div {...props} className={classNames('flex', className)}>
      {/* TODO */}
    </div>
  );
};
