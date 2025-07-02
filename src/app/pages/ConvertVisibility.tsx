import React, { FC, useCallback, useLayoutEffect, useState } from 'react';

import { useAppEnv } from 'app/env';
import { HistoryAction, navigate } from 'lib/woozie';
import { IndexScreen as ConvertTokensFlow } from 'screens/convert-tokens';

type ConvertVisibilityProps = {
  assetSlug?: string | null;
  assetId: string;
};

const ConvertVisibility: FC<ConvertVisibilityProps> = ({ assetSlug, assetId }) => {
  const { registerBackHandler } = useAppEnv();

  useLayoutEffect(() => {
    const backUrl = assetSlug === 'aleo' ? '/tokens/aleo' : `/tokens/${assetId}`;
    return registerBackHandler(() => {
      navigate(backUrl, HistoryAction.Replace);
    });
  }, [registerBackHandler, assetSlug, assetId]);

  const [isLoading] = useState(false);

  const onClose = useCallback(() => {
    const backUrl = `/tokens/${assetId}`;
    navigate(backUrl, HistoryAction.Replace);
  }, [assetId]);

  return (
    <ConvertTokensFlow
      aleoBalance={{
        private: 0,
        public: 0
      }}
      aleoTokenId={''}
      isLoading={isLoading}
      onClose={onClose}
      onSubmitForm={data => {
        return new Promise(() => {
          return true;
        });
      }}
      token={{
        id: 'id',
        name: 'name',
        privateBalance: 1,
        publicBalance: 1,
        fiatPrice: 1
      }}
      recommendedFees={{ private: '1', public: '1' }}
    />
  );
};

export default ConvertVisibility;
