import React, { ComponentProps, FC, ReactNode, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';

import classNames from 'clsx';

import DocBg from 'app/a11y/DocBg';
import { Button } from 'app/atoms/Button';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import ContentContainer from 'app/layouts/ContentContainer';
import { T } from 'lib/i18n/react';
import { PropsWithChildren } from 'lib/props-with-children';
import { goBack, HistoryAction, navigate, useLocation } from 'lib/woozie';

import { useOnboardingProgress } from '../pages/Onboarding/hooks/useOnboardingProgress.hook';
import { PageLayoutSelectors } from './PageLayout.selectors';
import { ChangelogOverlay } from './PageLayout/ChangelogOverlay/ChangelogOverlay';

interface PageLayoutProps extends PropsWithChildren, ToolbarProps {
  contentContainerStyle?: React.CSSProperties;
  hideToolbar?: boolean;
  showBottomBorder?: boolean;
}

const PageLayout: FC<PageLayoutProps> = ({
  children,
  contentContainerStyle,
  hideToolbar,
  showBottomBorder = true,
  ...toolbarProps
}) => {
  const { fullPage } = useAppEnv();

  const containerStyles = fullPage ? { height: '640px', width: '600px' } : { height: '600px', width: '360px' };

  return (
    <>
      <DocBg bgClassName="bg-white" />

      <div
        className={classNames('bg-white m-auto rounded-3xl relative flex flex-col flex-1')}
        style={{ ...containerStyles }}
      >
        <ContentPaper>
          {!hideToolbar && <Toolbar {...toolbarProps} />}

          <div className="flex flex-col flex-1" style={contentContainerStyle}>
            <ErrorBoundary whileMessage="displaying this page">
              <Suspense fallback={<SpinnerSection />}>{children}</Suspense>
            </ErrorBoundary>
          </div>
        </ContentPaper>
      </div>

      <ChangelogOverlay />
    </>
  );
};

export default PageLayout;

type ContentPaparProps = ComponentProps<typeof ContentContainer>;

const ContentPaper: FC<ContentPaparProps> = ({ className, style = {}, children, ...rest }) => {
  const appEnv = useAppEnv();

  return appEnv.fullPage ? (
    <ContentContainer>
      <div
        className={classNames('bg-white', 'rounded-3xl', 'flex flex-col flex-1', className)}
        style={{ minHeight: '20rem', ...style }}
        {...rest}
      >
        {children}
      </div>
    </ContentContainer>
  ) : (
    <ContentContainer
      padding={false}
      className={classNames('bg-white flex flex-col flex-1', className)}
      style={style}
      {...rest}
    >
      {children}
    </ContentContainer>
  );
};

const SpinnerSection: FC = () => (
  <div className="flex justify-center mt-24">
    <Spinner />
  </div>
);

type ToolbarProps = {
  advancedSettingsSection?: ReactNode;
  pageTitle?: ReactNode;
  hasBackAction?: boolean;
  step?: number;
  setStep?: (step: number) => void;
  skip?: boolean;
  attention?: boolean;
  showBottomBorder?: boolean;
};

const Toolbar: FC<ToolbarProps> = ({
  pageTitle,
  hasBackAction = true,
  step,
  setStep,
  skip,
  advancedSettingsSection,
  showBottomBorder
}) => {
  const { historyPosition, pathname } = useLocation();
  const { registerBackHandler, onBack } = useAppEnv();
  const { setOnboardingCompleted } = useOnboardingProgress();
  const { fullPage } = useAppEnv();

  const onStepBack = () => {
    if (step && setStep && step > 0) {
      setStep(step - 1);
    }
  };

  const inHome = pathname === '/';
  const properHistoryPosition = historyPosition > 0 || !inHome;
  const canBack = hasBackAction && properHistoryPosition;
  const canStepBack = Boolean(step) && step! > 0;
  const isBackButtonAvailable = canBack || canStepBack;

  useLayoutEffect(() => {
    return registerBackHandler(() => {
      switch (true) {
        case historyPosition > 0:
          goBack();
          break;

        case !inHome:
          navigate('/', HistoryAction.Replace);
          break;
      }
    });
  }, [registerBackHandler, historyPosition, inHome]);

  // eslint-disable-next-line
  const [sticked, setSticked] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const toolbarEl = rootRef.current;
    if ('IntersectionObserver' in window && toolbarEl) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setSticked(entry.boundingClientRect.y < entry.rootBounds!.y);
        },
        { threshold: [1] }
      );

      observer.observe(toolbarEl);
      return () => {
        observer.unobserve(toolbarEl);
      };
    }
    return undefined;
  }, [setSticked]);

  return (
    <div
      ref={rootRef}
      className={classNames(
        'sticky z-20 mx-4',
        'bg-white',
        'rounded-t-lg',
        'flex flex-col items-center',
        'transition ease-in-out duration-300'
      )}
      style={{
        // The top value needs to be -1px or the element will never intersect
        // with the top of the browser window
        // (thus never triggering the intersection observer).
        top: -1,
        borderBottom: showBottomBorder ? '1px solid #E9EBEF' : 'none'
      }}
    >
      <div className="flex justify-between w-full" style={{ paddingTop: '14px', paddingBottom: '14px' }}>
        {pageTitle && (
          <div
            className={classNames('flex items-center', 'text-black', 'text-right font-semibold leading-none')}
            style={{ fontSize: '18px', lineHeight: '24px' }}
          >
            {pageTitle}
          </div>
        )}

        <div className="flex items-center self-end">
          {advancedSettingsSection}
          {isBackButtonAvailable && (
            <Button
              className={classNames(
                'px-3 py-3',
                'rounded',
                'flex',
                'text-black font-bold text-shadow-black',
                'hover:bg-black hover:bg-opacity-5',
                'transition duration-300 ease-in-out',
                'opacity-90 hover:opacity-100'
              )}
              style={{ fontSize: 16, lineHeight: '20px' }}
              onClick={step ? onStepBack : onBack}
              testID={PageLayoutSelectors.BackButton}
            >
              <CloseIcon height={'13px'} width={'13px'} className={classNames('h-5 w-auto')} stroke={'black'} />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1" />
      {skip && (
        <div className="flex content-end">
          <Button
            className={classNames(
              'px-4 py-2',
              'rounded',
              'flex items-center',
              'text-black text-shadow-black',
              'text-sm font-semibold leading-none',
              'hover:bg-black hover:bg-opacity-5',
              'transition duration-300 ease-in-out',
              'opacity-90 hover:opacity-100'
            )}
            onClick={() => setOnboardingCompleted(true)}
          >
            <T id="skip" />
          </Button>
        </div>
      )}
    </div>
  );
};
