import React, { FC } from 'react';

import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

import { isMobile } from 'lib/platform';

interface OnboardingViewProps {
  renderHeader: () => JSX.Element;
  renderStep: () => JSX.Element;
  step: string;
  navigationDirection: string;
}

const OnboardingView: FC<OnboardingViewProps> = ({ renderHeader, renderStep, step, navigationDirection }) => {
  const mobile = isMobile();

  return (
    <div
      className={clsx(
        'flex flex-col bg-white overflow-hidden',
        mobile ? 'w-full h-full' : 'w-[37.5rem] h-[40rem] border border-gray-100 mx-auto rounded-3xl'
      )}
    >
      <AnimatePresence mode={'wait'} initial={false}>
        {renderHeader()}
      </AnimatePresence>
      <AnimatePresence mode={'wait'} initial={false}>
        <motion.div
          key={step}
          className="flex-1 flex flex-col"
          initial="initialState"
          animate="animateState"
          exit="exitState"
          transition={{
            type: 'tween',
            duration: 0.2
          }}
          variants={{
            initialState: {
              x: navigationDirection === 'forward' ? '1vw' : '-1vw',
              opacity: 0
            },
            animateState: {
              x: 0,
              opacity: 1
            },
            exitState: {
              x: navigationDirection === 'forward' ? '-1vw' : '1vw',
              opacity: 0
            }
          }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingView;
