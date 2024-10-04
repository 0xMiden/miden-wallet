import React, { useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Button } from 'components/Button';
import { TextArea } from 'components/TextArea';

export interface ImportSeedPhraseScreenProps {
  className?: string;
  onSubmit?: (seedPhrase: string) => void;
}

export const ImportSeedPhraseScreen: React.FC<ImportSeedPhraseScreenProps> = ({ className, onSubmit }) => {
  const { t } = useTranslation();
  const [seedPhrase, setSeedPhrase] = useState('');

  const handleSeedPhraseChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSeedPhrase(event.target.value);
  };

  const handleClear = () => {
    setSeedPhrase('');
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = '48px';
    }
  };

  const isButtonEnabled = seedPhrase.trim().split(/\s+/).length === 12;

  const handleSubmit = () => {
    if (isButtonEnabled && onSubmit) {
      onSubmit(seedPhrase);
    }
  };

  return (
    <div className={classNames('flex-1', 'flex flex-col justify-start items-center', 'bg-white p-6', className)}>
      <h1 className="text-2xl font-semibold">{t('importWallet')}</h1>
      <p className="text-sm">{t('uploadYourEncryptedWalletFile')}</p>

      <div className="relative w-[360px] my-8">
        <TextArea
          placeholder={t('seedPhrasePlaceholder')}
          className="w-full pr-10"
          value={seedPhrase}
          onChange={handleSeedPhraseChange}
        />
        {seedPhrase && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-0 right-0 mt-3 mr-3 "
            aria-label="Clear text"
          >
            <Icon name={IconName.CloseCircle} fill="black" size="md" />
          </button>
        )}
      </div>
      <Button title={t('continue')} onClick={handleSubmit} disabled={!isButtonEnabled} className="w-[360px]" />
    </div>
  );
};
