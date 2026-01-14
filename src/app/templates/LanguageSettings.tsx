import React, { FC } from 'react';

import LocaleSelect from './LocaleSelect';

const LanguageSettings: FC = () => {
  return (
    <div className="w-full max-w-sm mx-auto my-8">
      <LocaleSelect />
    </div>
  );
};

export default LanguageSettings;
