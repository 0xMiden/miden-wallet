import React, { useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';
import { shuffle } from 'lodash';
import { useTranslation } from 'react-i18next';

import { Button } from 'components/Button';
import { Chip } from 'components/Chip';

export interface VerifySeedPhraseScreenProps extends React.ButtonHTMLAttributes<HTMLDivElement> {
  seedPhrase: string[];
  onSubmit?: () => void;
}

export const VerifySeedPhraseScreen: React.FC<VerifySeedPhraseScreenProps> = ({
  seedPhrase,
  className,
  onSubmit,
  ...props
}) => {
  const { t } = useTranslation();
  const shuffledWords = useMemo(() => shuffle(seedPhrase), [seedPhrase]);
  const wordIndexToVerify = 9;
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

  const onSelectWord = useCallback((index: number) => {
    setSelectedWordIndex(index);
  }, []);

  const isCorrectWordSelected = useMemo(() => {
    if (selectedWordIndex === null) {
      return false;
    }
    return shuffledWords[selectedWordIndex] === seedPhrase[wordIndexToVerify];
  }, [selectedWordIndex, shuffledWords, seedPhrase, wordIndexToVerify]);

  return (
    <div className={classNames('flex-1', 'flex flex-col', 'bg-white gap-8 p-6', className)} {...props}>
      <div className="flex flex-col items-center">
        <header className="text-2xl font-semibold">{t('verifySeedPhrase')}</header>
        <p className="text-sm font-normal mt-2 w-[500px] text-center">{t('verifyMessagePrefix')}</p>
      </div>

      <article className="grid grid-cols-3 gap-4 w-[80%] self-center">
        {shuffledWords.map((word, index) => (
          <button key={`seed-word-${index}`} onClick={() => onSelectWord(index)}>
            <Chip className="cursor-pointer" selected={selectedWordIndex === index} label={word} />
          </button>
        ))}
      </article>

      <div className="w-[360px] flex flex-col gap-2 self-center">
        <Button disabled={!isCorrectWordSelected} title={t('continue')} onClick={onSubmit} />
      </div>
    </div>
  );
};
