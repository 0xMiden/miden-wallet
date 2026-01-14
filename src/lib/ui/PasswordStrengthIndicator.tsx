import React, { FC } from 'react';

import { useTranslation } from 'react-i18next';

import PasswordStrengthIndicatorItem from './PasswordStrengthIndicatorItem';

export interface PasswordValidation {
  minChar: boolean;
  cases: boolean;
  number: boolean;
  specialChar: boolean;
}

interface PasswordStrengthIndicatorProps {
  validation: PasswordValidation;
}

const PasswordStrengthIndicator: FC<PasswordStrengthIndicatorProps> = ({
  validation: { minChar, cases, number, specialChar }
}) => {
  const { t } = useTranslation();

  return (
    <div className={'mx-2 mb-4 text-black p-4 text-black border-2 border-gray-100 rounded-lg'}>
      <PasswordStrengthIndicatorItem
        isValid={minChar && cases && number && specialChar}
        message={t('requirements')}
        title
      />
      <div className="list-disc list-inside">
        <PasswordStrengthIndicatorItem isValid={minChar} message={t('atLeast8Characters')} />
        <PasswordStrengthIndicatorItem isValid={cases} message={t('mixtureOfUppercaseAndLowercaseLetters')} />
        <PasswordStrengthIndicatorItem isValid={number} message={t('mixtureOfLettersAndNumbers')} />
        <PasswordStrengthIndicatorItem isValid={specialChar} message={t('atLeast1SpecialCharacter')} />
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
