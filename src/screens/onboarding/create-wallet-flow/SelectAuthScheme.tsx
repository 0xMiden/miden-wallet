import React from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowRightIcon } from 'app/icons/arrow-right.svg';
import { Button } from 'components/Button';
import { AuthScheme } from 'screens/onboarding/types';

const AuthSchemeOptions = [
  {
    id: AuthScheme.Falcon,
    title: 'Falcon',
    description:
      'Provides security against future quantum attacks, ensuring long-term protection of your assets. Longer keys and less widely supported with longer proving times.'
  },
  {
    id: AuthScheme.ECDSA,
    title: 'ECDSA(secp256k1)',
    description:
      'Does not provide security against future quantum attacks. Widely adopted and supported, ECDSA offers shorter keys and faster proving times.'
  }
];

export interface SelectAuthSchemeScreenProps {
  onSubmit?: () => void;
  authScheme: AuthScheme;
  setAuthScheme: (authScheme: AuthScheme) => void;
  onCreateAccountScreen?: boolean;
}

const SelectAuthScheme = ({
  onSubmit,
  authScheme,
  setAuthScheme,
  onCreateAccountScreen = false
}: SelectAuthSchemeScreenProps) => {
  const { t } = useTranslation();
  const handleWalletTypeSelect = (type: AuthScheme) => {
    setAuthScheme(type);
  };

  return (
    <div className={classNames('w-full max-w-sm mx-auto', onCreateAccountScreen ? 'pb-2' : 'p-6')}>
      {/* Wallet Type Selection */}
      <div className="mb-8">
        <div className="font-medium mb-4" style={{ fontSize: '14px', lineHeight: '20px' }}>
          Choose your preferred authentication scheme, which have trade-offs between security and performance:
        </div>
        {AuthSchemeOptions.map((option, idx) => (
          <div
            key={option.id}
            className={classNames('flex flex-col border p-4 rounded-lg cursor-pointer', 'w-full', 'mb-4', {
              'bg-blue-100': authScheme === option.id // Highlight if selected
            })}
            onClick={() => handleWalletTypeSelect(option.id)}
          >
            <div className="flex flex-row justify-between items-center">
              <h3 className="font-medium text-base">{option.title}</h3>
              <ArrowRightIcon fill="black" height="20px" width="20px" />
            </div>
            <p className="text-grey-600">{option.description}</p>
          </div>
        ))}
      </div>
      {!onCreateAccountScreen && (
        <div className="w-[360px] flex flex-col gap-2 self-center">
          <Button title={t('continue')} onClick={onSubmit} />
        </div>
      )}
    </div>
  );
};

export default SelectAuthScheme;
