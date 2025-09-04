import React, { FC } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

interface OnboardingViewProps {
  renderHeader: () => JSX.Element;
  renderStep: () => JSX.Element;
  step: string;
  navigationDirection: string;
}

const OnboardingView: FC<OnboardingViewProps> = ({ renderHeader, renderStep, step, navigationDirection }) => {
  return (
    <div className="w-[37.5rem] h-[40rem] mx-auto flex flex-col bg-white rounded-3xl overflow-hidden">
      <AnimatePresence mode={'wait'} initial={false}>
        {renderHeader()}
      </AnimatePresence>
      <AnimatePresence mode={'wait'} initial={false}>
        <motion.div
          key={step}
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
