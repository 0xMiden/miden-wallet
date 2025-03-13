import React, { FC, useCallback, useLayoutEffect, useState } from 'react';

import { useRecommendedConvertFee } from 'app/constants';
import { useAppEnv } from 'app/env';
import { useAssetFiatCurrencyPrice } from 'lib/fiat-curency';
import { formatBigInt, stringToAleoMicrocredits, stringToBigInt } from 'lib/i18n/numbers';
import { useAccount, useFungibleTokens, useAssetMetadata, useMidenContext, useBalance } from 'lib/miden/front';
import { HistoryAction, navigate } from 'lib/woozie';
import { IndexScreen as ConvertTokensFlow } from 'screens/convert-tokens';
import { UIFeeType, UIFees, UIForm, UIToken } from 'screens/convert-tokens/types';

type ConvertVisibilityProps = {
  assetSlug?: string | null;
  assetId: string;
};

const ConvertVisibility: FC<ConvertVisibilityProps> = ({ assetSlug, assetId }) => {
  const { registerBackHandler } = useAppEnv();

  const account = useAccount();

  const assetMetadata = useAssetMetadata(assetSlug!, assetId!);

  useLayoutEffect(() => {
    const backUrl = assetSlug === 'aleo' ? '/tokens/aleo' : `/tokens/${assetId}`;
    return registerBackHandler(() => {
      navigate(backUrl, HistoryAction.Replace);
    });
  }, [registerBackHandler, assetSlug, assetId]);

  const [isLoading, setIsLoading] = useState(false);

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
