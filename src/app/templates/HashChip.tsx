import React, { ComponentProps, FC, HTMLAttributes } from 'react';

import CopyButton, { CopyButtonProps } from 'app/atoms/CopyButton';
import HashShortView from 'app/atoms/HashShortView';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';

type HashChipProps = HTMLAttributes<HTMLButtonElement> &
  ComponentProps<typeof HashShortView> &
  Pick<CopyButtonProps, 'small' | 'type' | 'bgShade' | 'rounded' | 'textShade'>;

const HashChip: FC<HashChipProps> = ({
  hash,
  trim,
  trimAfter,
  firstCharsCount,
  lastCharsCount,
  type = 'button',
  ...rest
}) => (
  <CopyButton text={hash} type={type} {...rest}>
    <span className="flex flex-row items-center">
      <HashShortView
        hash={hash}
        trim={trim}
        trimAfter={trimAfter}
        firstCharsCount={firstCharsCount}
        lastCharsCount={lastCharsCount}
      />
      <CopyIcon className="w-4 h-4 ml-4" />
    </span>
  </CopyButton>
);

export default HashChip;
