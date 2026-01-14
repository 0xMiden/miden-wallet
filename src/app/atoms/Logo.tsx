import React, { CSSProperties, memo, HTMLAttributes } from 'react';

import { useTranslation } from 'react-i18next';

import LogoTitle from 'app/misc/logo-title.png';
import PlainLogo from 'app/misc/logo.svg';

type LogoProps = HTMLAttributes<HTMLImageElement> & {
  hasTitle?: boolean;
  white?: boolean;
  style?: CSSProperties;
};

const Logo = memo<LogoProps>(({ hasTitle, white, style = {}, ...rest }) => {
  const { t } = useTranslation();
  const titleLogo = LogoTitle;
  const imageUri = hasTitle ? titleLogo : PlainLogo;

  return (
    <img
      src={imageUri!}
      title={t('appName')}
      alt={t('appName')}
      style={{
        height: 40,
        width: 'auto',
        marginTop: 6,
        marginBottom: 6,
        filter: white ? 'brightness(0) invert(1)' : '',
        ...style
      }}
      {...rest}
    />
  );
});

export default Logo;
