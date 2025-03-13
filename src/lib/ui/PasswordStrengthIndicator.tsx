import React, { FC } from 'react';

import { T } from '../i18n/react';
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
}) => (
  <div className={'mx-2 mb-4 text-black p-4 text-black border-2 border-gray-100 rounded-lg'}>
    <T id="requirements">
      {message => (
        <PasswordStrengthIndicatorItem isValid={minChar && cases && number && specialChar} message={message} title />
      )}
    </T>
    <div className="list-disc list-inside">
      <T id="atLeast8Characters">{message => <PasswordStrengthIndicatorItem isValid={minChar} message={message} />}</T>
      <T id="mixtureOfUppercaseAndLowercaseLetters">
        {message => <PasswordStrengthIndicatorItem isValid={cases} message={message} />}
      </T>
      <T id="mixtureOfLettersAndNumbers">
        {message => <PasswordStrengthIndicatorItem isValid={number} message={message} />}
      </T>
      <T id="atLeast1SpecialCharacter">
        {message => <PasswordStrengthIndicatorItem isValid={specialChar} message={message} />}
      </T>
    </div>
  </div>
);

export default PasswordStrengthIndicator;
