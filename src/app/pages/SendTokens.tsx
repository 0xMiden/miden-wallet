import React, { useCallback, useMemo, useState } from 'react';

import { useRecommendedFee } from 'app/constants';
import { Loader } from 'components/Loader';
import { ALEO_SLUG, ALEO_TOKEN_ID } from 'lib/miden/assets/constants';
import { useAccount, useMidenContext, useAllTokensBaseMetadata } from 'lib/miden/front';
import { useFilteredContacts } from 'lib/miden/front/use-filtered-contacts.hook';
import { getANSAddress, isAddressValid } from 'lib/miden/helpers';
import { formatBigInt, stringToAleoMicrocredits, stringToBigInt } from 'lib/i18n/numbers';
import { navigate, useLocation } from 'lib/woozie';
import { IndexScreen as SendTokensFlow } from 'screens/send-tokens';
import { UIContact, UIFeeType, UIFees, UIForm, UIToken, UITransactionType } from 'screens/send-tokens/types';

export const SendTokens = () => {
  const { search } = useLocation();
  const account = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const recommendedFees: UIFees = {
    ALEO: {
      [UITransactionType.Public]: {
        [UITransactionType.Public]: formatBigInt(useRecommendedFee(ALEO_SLUG, false, false)),
        [UITransactionType.Private]: formatBigInt(useRecommendedFee(ALEO_SLUG, false, true))
      },
      [UITransactionType.Private]: {
        [UITransactionType.Public]: formatBigInt(useRecommendedFee(ALEO_SLUG, true, false)),
        [UITransactionType.Private]: formatBigInt(useRecommendedFee(ALEO_SLUG, true, true))
      }
    },
    OTHER: {
      [UITransactionType.Public]: {
        [UITransactionType.Public]: formatBigInt(useRecommendedFee('', false, false)),
        [UITransactionType.Private]: formatBigInt(useRecommendedFee('', false, true))
      },
      [UITransactionType.Private]: {
        [UITransactionType.Public]: formatBigInt(useRecommendedFee('', true, false)),
        [UITransactionType.Private]: formatBigInt(useRecommendedFee('', true, true))
      }
    }
  };

  const preselectedTokenId = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    return searchParams.get('token') || undefined;
  }, [search]);

  const allTokenMetadata = useAllTokensBaseMetadata();

  const onClose = useCallback(() => {
    navigate('/');
  }, []);

  const onSubmitForm = useCallback(async () => {
    try {
      setIsLoading(true);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      }
      console.error(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onNavigateTo = useCallback((url: 'buy-tokens' | 'transfer-tokens' | 'faucet') => {
    switch (url) {
      case 'transfer-tokens':
        navigate('/convert-visibility/aleo');
        break;
      case 'faucet':
        navigate('/faucet');
        break;
    }
  }, []);

  return (
    <SendTokensFlow
      aleoBalance={{
        private: 0,
        public: 0
      }}
      aleoRecordCount={1}
      aleoTokenId={ALEO_TOKEN_ID}
      contacts={[]}
      accountWallet={account.publicKey}
      recommendedFees={recommendedFees}
      isLoading={isLoading}
      preselectedTokenId={preselectedTokenId}
      onClose={onClose}
      onNavigateTo={onNavigateTo}
    />
  );
};
