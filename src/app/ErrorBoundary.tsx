import React, { Component, ErrorInfo } from 'react';

import classNames from 'clsx';

import { Button, ButtonVariant } from 'components/Button';
import { t, T } from 'lib/i18n/react';
import { PropsWithChildren } from 'lib/props-with-children';

import { WindowType } from './env';
import { Icon, IconName } from './icons/v2';

interface ErrorBoundaryProps extends PropsWithChildren {
  className?: string;
  whileMessage?: string;
  windowType?: WindowType;
}

type ErrorBoundaryState = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error: error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error.message, errorInfo.componentStack);
  }

  componentDidMount() {
    window.addEventListener('reseterrorboundary', () => {
      if (this.state.error) {
        this.tryAgain();
      }
    });
  }

  tryAgain() {
    this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      const online = getOnlineStatus();
      const fullPage = this.props.windowType === WindowType.FullPage;

      return (
        <div
          className={classNames(
            'w-full',
            'flex items-center justify-center',
            this.props.className,
            fullPage && 'bg-white mt-[-24px]'
          )}
        >
          <div className={classNames('p-4', 'flex flex-col items-center', 'text-black')}>
            <Icon name={IconName.Frown} size="3xl" className="mb-8" />

            <T id="oops">{message => <h2 className="mb-1 text-2xl">{message}</h2>}</T>

            <p className="mb-4 text-sm opacity-90 text-center ">
              {this.props.whileMessage ? (
                <T id="smthWentWrongWhile" substitutions={this.props.whileMessage} />
              ) : (
                <T id="smthWentWrong" />
              )}
              {!online && (
                <T id="mayHappenBecauseYouAreOffline">
                  {message => (
                    <>
                      {'. '}
                      {message}
                    </>
                  )}
                </T>
              )}
            </p>

            <Button variant={ButtonVariant.Primary} title={t('tryAgain')} className="w-full mt-4" />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function getOnlineStatus() {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
}
