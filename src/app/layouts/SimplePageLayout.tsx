import React, { FC, ReactNode } from 'react';

import classNames from 'clsx';

import DocBg from 'app/a11y/DocBg';
import { useAppEnv } from 'app/env';
import ContentContainer from 'app/layouts/ContentContainer';
import { PropsWithChildren } from 'lib/props-with-children';

interface SimplePageLayoutProps extends PropsWithChildren {
  title?: ReactNode;
  icon?: ReactNode;
}

const SimplePageLayout: FC<SimplePageLayoutProps> = ({ title, icon, children }) => {
  const { fullPage } = useAppEnv();
  const containerStyle = fullPage ? { height: '600px', width: '360px', margin: 'auto', overflow: 'hidden' } : {};
  const containerClass = fullPage ? 'shadow-2xl' : '';

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
                background: `url("data:image/svg+xml,%3Csvg width='267' height='235' viewBox='0 0 267 235' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect y='-235' width='471' height='470' fill='url(%23paint0_radial_4712_3132)'/%3E%3Cdefs%3E%3CradialGradient id='paint0_radial_4712_3132' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='translate(235.5) rotate(90) scale(235 235.5)'%3E%3Cstop stop-color='%23EFE0FB'/%3E%3Cstop offset='1' stop-color='%23EFE0FB' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3C/svg%3E")`,
                backgroundSize: '100% 100%'
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
