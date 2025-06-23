import React, { FC } from 'react';

import { IconName, Icon } from 'app/icons/v2';
import { ProgressIndicator } from 'components/ProgressIndicator';
import { SquareButton } from 'components/SquareButton';

interface OnboardingHeaderProps {
  currentStep: number;
  steps: number;
  showBackButton: boolean;
  showProgressIndicator: boolean;
  onBack: () => void;
}

const OnboardingHeader: FC<OnboardingHeaderProps> = ({
  currentStep,
  steps,
  showBackButton,
  showProgressIndicator,
  onBack
}) => {
  return (
    <div className="flex justify-between items-center pt-6 px-6">
      <SquareButton
        icon={IconName.ArrowLeft}
        onClick={onBack}
        className={showBackButton ? '' : 'opacity-0 pointer-events-none'}
      />

      <Icon
        name={IconName.LeoLogoAndName}
        style={{
          width: 228,
          height: 24
        }}
      />

      <ProgressIndicator currentStep={currentStep} steps={steps} className={showProgressIndicator ? '' : 'opacity-0'} />
    </div>
  );
};

export default OnboardingHeader;
