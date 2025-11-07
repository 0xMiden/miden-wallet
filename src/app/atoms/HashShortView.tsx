import React, { memo } from 'react';

type HashShortViewProps = {
  hash: string;
  trimHash?: boolean;
  trimAfter?: number;
  firstCharsCount?: number;
  lastCharsCount?: number;
  displayName?: string;
};

const HashShortView = memo<HashShortViewProps>(
  ({ hash, trimHash = true, trimAfter = 20, firstCharsCount = 7, lastCharsCount = 4, displayName }) => {
    if (!hash) return null;

    const trimmedDisplayValue = (() => {
      if (displayName) return displayName;
      if (!trimHash) return hash;

      const ln = hash.length;
      return ln > trimAfter ? (
        <>
          {hash.slice(0, firstCharsCount)}
          <span className="opacity-75">...</span>
          {hash.slice(ln - lastCharsCount, ln)}
        </>
      ) : (
        hash
      );
    })();

    return <>{trimmedDisplayValue}</>;
  }
);

export default HashShortView;
