import React, { FC, useRef } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import PageLayout from 'app/layouts/PageLayout';
import History from 'app/templates/history/History';
import { Button, ButtonVariant } from 'components/Button';
import { useAccount, useAllBalances, useAllTokensBaseMetadata } from 'lib/miden/front';
import { goBack } from 'lib/woozie';

type TokenHistoryProps = {
  tokenId: string;
};

const TokenHistory: FC<TokenHistoryProps> = ({ tokenId }) => {
  const { t } = useTranslation();
  const account = useAccount();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const allTokensMetadata = useAllTokensBaseMetadata();
  const { data: balances } = useAllBalances(account.publicKey, allTokensMetadata);

  // Get token name from balances (which has metadata embedded) or fall back to metadata store
  const tokenFromBalances = balances?.find(b => b.tokenId === tokenId);
  const tokenName = tokenFromBalances?.metadata?.symbol || allTokensMetadata[tokenId]?.symbol || t('unknown');

  return (
    <PageLayout pageTitle={t('tokenHistory', { tokenName })} hasBackAction={true}>
      <div className="flex flex-col flex-1 min-h-0 md:w-[460px] md:mx-auto">
        <div className={classNames('flex-1 min-h-0 overflow-y-auto', 'bg-white z-30 relative')} ref={scrollParentRef}>
          <div className="px-4">
            <History
              address={account.publicKey}
              tokenId={tokenId}
              fullHistory={true}
              scrollParentRef={scrollParentRef}
            />
          </div>
        </div>
        <div className="flex-none p-4">
          <Button title={t('close')} variant={ButtonVariant.Secondary} onClick={goBack} />
        </div>
      </div>
    </PageLayout>
  );
};

export default TokenHistory;
