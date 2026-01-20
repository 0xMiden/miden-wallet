import React, { FC, useEffect, useRef } from 'react';

import { isExtension } from 'lib/platform';
import { PropsWithChildren } from 'lib/props-with-children';

/**
 * Wrapper for full-screen pages (Send, Receive, etc.) that slides in from the right.
 * Animation is disabled for the Chrome extension.
 */
const FullScreenPage: FC<PropsWithChildren> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Skip animation for Chrome extension
    if (isExtension()) return;

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

  return (
    <div ref={containerRef} className="flex flex-col h-full w-full" style={{ willChange: 'transform, opacity' }}>
      {children}
    </div>
  );
};

export default FullScreenPage;
