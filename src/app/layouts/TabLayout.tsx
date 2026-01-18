import React, { FC, useEffect, useRef } from 'react';

import classNames from 'clsx';

import { useAppEnv } from 'app/env';
import { useActivityBadge } from 'app/hooks/useActivityBadge';
import Footer from 'app/layouts/PageLayout/Footer';
import { isReturningFromWebview } from 'lib/mobile/webview-state';
import { isMobile } from 'lib/platform';
import { PropsWithChildren } from 'lib/props-with-children';
import { useLocation } from 'lib/woozie';

/**
 * Layout for tab-based pages (Home, Activity, Settings, Browser).
 * Provides a persistent footer and animated content area.
 */
const TabLayout: FC<PropsWithChildren> = ({ children }) => {
  const activityBadge = useActivityBadge();
  const { fullPage } = useAppEnv();
  const { pathname } = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  // Animate content on route change
  // Remove class after animation completes to prevent replay on display toggle
  // (resetViewportAfterWebview toggles display:none which restarts CSS animations)
  useEffect(() => {
    if (!contentRef.current) return;
    if (isMobile() && isReturningFromWebview()) return;

    const el = contentRef.current;
    el.classList.remove('mobile-page-enter');
    // Force reflow to restart animation
    void el.offsetWidth;
    el.classList.add('mobile-page-enter');

    // Remove class after animation completes to prevent restart on display toggle
    const handleAnimationEnd = () => {
      el.classList.remove('mobile-page-enter');
    };
    el.addEventListener('animationend', handleAnimationEnd, { once: true });

    return () => {
      el.removeEventListener('animationend', handleAnimationEnd);
    };
  }, [pathname]);

  // Container sizing
  const containerStyles = isMobile()
    ? { height: '100dvh', width: '100%' }
    : fullPage
      ? { height: '640px', width: '600px' }
      : { height: '600px', width: '360px' };

  return (
    <div className={classNames('flex flex-col m-auto bg-white', fullPage && 'rounded-3xl')} style={containerStyles}>
      {/* Animated content area */}
      <div
        ref={contentRef}
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </div>

      {/* Persistent footer */}
      <div className="flex-none">
        <Footer activityBadge={activityBadge} />
      </div>
    </div>
  );
};

export default TabLayout;
