import React, { HTMLAttributes, useCallback, useEffect, useState } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { Chip } from 'components/Chip';

export interface BackUpWalletScreenProps extends HTMLAttributes<HTMLDivElement> {
  seedPhrase: string[];
  onSubmit?: () => void;
}

export const BackUpWalletScreen: React.FC<BackUpWalletScreenProps> = ({
  seedPhrase,
  className,
  onSubmit,
  ...props
}) => {
  const { t } = useTranslation();
  const [isWordsVisible, setIsWordsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const onCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(seedPhrase.join(' '));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [seedPhrase]);

  const onWordsVisibilityToggle = useCallback(() => {
    setIsWordsVisible(prev => !prev);
  }, []);

  useEffect(() => {
    document.addEventListener('copy', event => {
      const selectedText = window.getSelection()?.toString();
      const formattedText = selectedText?.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ');
      event.clipboardData?.setData('text/plain', formattedText || '');
      event.preventDefault(); // Prevent the default copy action
    });

    return () => {
      document.removeEventListener('copy', () => {});
    };
  }, []);

  return (
    <div className={classNames('flex-1', 'flex flex-col', 'bg-white gap-8 p-6', className)} {...props}>
      <div className="flex flex-col items-center">
        <header className="text-2xl font-semibold">{t('backUpYourWallet')}</header>
        <p className="text-sm font-normal mt-2 text-center w-[500px]">{t('backUpWalletInstructions')}</p>
      </div>

      <article className="grid grid-cols-3 gap-4 w-[82%] self-center">
        {seedPhrase.map((word, index) => (
          <Chip
            key={`seed-word-${index}`}
            label={
              <label
                className={classNames(
                  'flex flex-row gap-1',
                  'transition duration-300 ease-in-out',
                  isWordsVisible ? 'blur-none' : 'blur-sm'
                )}
              >
                <p className="text-grey-600 select-none pointer-events-none">{`${index + 1}.`}</p>
                <p>{`${word}`}</p>
              </label>
            }
          />
        ))}
      </article>

      <div className="flex gap-2 w-[80%] self-center">
        <Button
          className="flex-1"
          variant={ButtonVariant.Ghost}
          title={t(isWordsVisible ? 'hide' : 'show')}
          iconLeft={isWordsVisible ? IconName.EyeOff : IconName.Eye}
          onClick={onWordsVisibilityToggle}
        />
        <Button
          className="flex-1"
          variant={ButtonVariant.Ghost}
          title={t(isCopied ? 'copied' : 'copyToClipboard')}
          iconLeft={isCopied ? IconName.CheckboxCircleFill : IconName.FileCopy}
          onClick={onCopyToClipboard}
        />
      </div>

      <div className="w-[360px] flex flex-col gap-2 self-center">
        <Button title={t('continue')} onClick={onSubmit} />
      </div>
    </div>
  );
};
