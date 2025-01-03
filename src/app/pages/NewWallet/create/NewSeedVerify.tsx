import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';

import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { OnboardingSelectors } from 'app/pages/Onboarding.selectors';
import { T } from 'lib/i18n/react';

const WORDS_TO_FILL = 2;

const range = (size: number) => {
  return [...Array(size).keys()].map(i => i + 0);
};

const shuffle = (array: any[]) => {
  const length = array == null ? 0 : array.length;
  if (!length) {
    return [];
  }
  let index = -1;
  const lastIndex = length - 1;
  const result = [...array];
  while (++index < length) {
    const rand = index + Math.floor(Math.random() * (lastIndex - index + 1));
    const value = result[rand];
    result[rand] = result[index];
    result[index] = value;
  }
  return result;
};

interface NewSeedVerifyProps {
  seedPhrase: string;
  onVerificationComplete: () => void;
}

export const NewSeedVerify: FC<NewSeedVerifyProps> = ({ seedPhrase, onVerificationComplete }) => {
  console.log('rendered NewSeedVerify');
  const { handleSubmit } = useForm();
  const words = useMemo(() => seedPhrase.split(' '), [seedPhrase]);
  const wordsToCheckPositions = useMemo(() => {
    const shuffledPositions = shuffle(range(words.length));
    const selectedPositions: number[] = [];
    for (let i = 0; i < words.length; i++) {
      const newPosition = shuffledPositions[i];
      if (
        selectedPositions.every(selectedPosition => {
          const distance = Math.abs(selectedPosition - newPosition);
          if ([selectedPosition, newPosition].some(position => [0, words.length - 1].some(edge => edge === position))) {
            return distance > 2;
          }

          return distance > 1;
        })
      ) {
        selectedPositions.push(newPosition);
      }
      if (selectedPositions.length === WORDS_TO_FILL) {
        break;
      }
    }

    return selectedPositions.sort((a, b) => a - b);
  }, [words]);

  const [filledIndexes, setFilledIndexes] = useState<number[]>([]);

  const handleFill = useCallback(
    (index: number, isPresent: boolean) => {
      setFilledIndexes(fi => {
        if (isPresent) {
          return fi.includes(index) ? fi : [...fi, index];
        } else {
          return fi.filter(i => i !== index);
        }
      });
    },
    [setFilledIndexes]
  );

  const filled = useMemo(
    () => wordsToCheckPositions.every(i => filledIndexes.includes(i)),
    [wordsToCheckPositions, filledIndexes]
  );

  return (
    <div className="w-full mx-auto mt-8">
      <form className="w-full mt-8" onSubmit={handleSubmit(onVerificationComplete)}>
        <h3 className={classNames('mt-2 mb-8', 'text-black text-xs font-normal')}>
          <T id="verifySeedPhraseDescription" />
        </h3>

        <div className="flex flex-col">
          {wordsToCheckPositions.map((indexToFill, i) => (
            <WordsRow
              key={i}
              allWords={words}
              indexToFill={indexToFill}
              onFill={isPresent => handleFill(indexToFill, isPresent)}
            />
          ))}
        </div>
        <div className="flex flex-col justify-end">
          <FormSubmitButton
            disabled={!filled}
            className="w-full text-base py-4 mb-2 mx-auto"
            style={{ display: 'block', fontWeight: 500, padding: '12px 0px', marginTop: '180px' }}
            testID={OnboardingSelectors.VerifySeedPhraseButton}
          >
            <T id="next" />
          </FormSubmitButton>
        </div>
      </form>
    </div>
  );
};

type WordsRowProps = {
  allWords: string[];
  indexToFill: number;
  onFill: (filled: boolean) => void;
};

const WordsRow = memo<WordsRowProps>(({ allWords, indexToFill, onFill }) => {
  const nearIndexes = useMemo(() => getTwoNearIndexes(indexToFill, allWords.length), [indexToFill, allWords.length]);
  const indexes = useMemo(() => sortNumbers([indexToFill, ...nearIndexes]), [indexToFill, nearIndexes]);
  const [fillValue, setFillValue] = useState('');

  const handleChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
      const { value } = evt.target;
      setFillValue(value);
      onFill(value === allWords[indexToFill]);
    },
    [setFillValue, onFill, allWords, indexToFill]
  );

  return (
    <div className={classNames('mb-6', '-mx-2', 'flex items-stretch')}>
      {indexes.map(i => {
        const toFill = i === indexToFill;

        return (
          <div key={i} className="p-2">
            <FormField
              label={<div className="text-sm">#{i + 1}</div>}
              labelPaddingClassName="flex mb-2 flex-col"
              {...(toFill
                ? {
                    value: fillValue,
                    onChange: handleChange
                  }
                : {
                    disabled: true,
                    defaultValue: allWords[i],
                    className: 'bg-gray-800 text-gray-500'
                  })}
            />
          </div>
        );
      })}
    </div>
  );
});

function getTwoNearIndexes(index: number, limit: number) {
  switch (true) {
    case index === 0:
      return [1, 2];

    case index === limit - 1:
      return [limit - 2, limit - 3];

    default:
      return [index - 1, index + 1];
  }
}

function sortNumbers(arr: number[]) {
  return arr.sort((a, b) => a - b);
}
