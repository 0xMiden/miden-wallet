import React, { FC, ReactNode } from 'react';

import classNames from 'clsx';

import DocBg from 'app/a11y/DocBg';
import { useAppEnv } from 'app/env';
import ContentContainer from 'app/layouts/ContentContainer';
import { isMobile } from 'lib/platform';
import { PropsWithChildren } from 'lib/props-with-children';

interface SimplePageLayoutProps extends PropsWithChildren {
  title?: ReactNode;
  icon?: ReactNode;
}

const SimplePageLayout: FC<SimplePageLayoutProps> = ({ title, icon, children }) => {
  const { fullPage } = useAppEnv();
  // On mobile, use fixed height with dvh (dynamic viewport height) for proper iOS handling
  const containerStyle = isMobile()
    ? { height: '100dvh', width: '100%', overflow: 'hidden' }
    : fullPage
      ? { height: '600px', width: '360px', margin: 'auto', overflow: 'hidden' }
      : {};
  const containerClass = fullPage && !isMobile() ? 'shadow-2xl' : '';

  return (
    <>
      <DocBg bgClassName="bg-white" />

      <ContentContainer
        className={classNames('flex flex-col', 'bg-white', 'rounded-lg', `${containerClass}`)}
        style={containerStyle}
      >
        <div className={classNames('flex flex-col items-center justify-center')}>
          {icon && (
            <div
              className={`flex w-full flex-row 'justify-start'`}
              style={{
                paddingLeft: '32px',
                paddingTop: '32px',
                paddingBottom: '112px',
                background: 'url(/misc/bg.svg) white center top / 200% no-repeat'
              }}
            >
              {icon}
            </div>
          )}

          {title && (
            <div className={classNames('mt-4 w-full', 'text-left', 'text-lg text-medium  leading-tight', 'text-black')}>
              {title}
            </div>
          )}
        </div>

        <div className={classNames('bg-white')}>{children}</div>

        <div className={classNames('flex-1', 'px-4 bg-white')} />
      </ContentContainer>
    </>
  );
};

export default SimplePageLayout;
