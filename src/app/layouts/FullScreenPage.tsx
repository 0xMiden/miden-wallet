import React, { FC, useEffect, useRef } from 'react';

import { isMobile } from 'lib/platform';
import { PropsWithChildren } from 'lib/props-with-children';

/**
 * Wrapper for full-screen pages (Send, Receive, etc.) that slides in from the right on mobile.
 */
const FullScreenPage: FC<PropsWithChildren> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobile() || !containerRef.current) return;

    const el = containerRef.current;
    el.classList.add('mobile-page-enter');

    // Remove class after animation completes to prevent restart on display toggle
    // (resetViewportAfterWebview toggles display:none which restarts CSS animations)
    const handleAnimationEnd = () => {
      el.classList.remove('mobile-page-enter');
    };
    el.addEventListener('animationend', handleAnimationEnd, { once: true });

    return () => {
      el.removeEventListener('animationend', handleAnimationEnd);
    };
  }, []);

  if (!isMobile()) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} style={{ willChange: 'transform, opacity' }}>
      {children}
    </div>
  );
};

export default FullScreenPage;
