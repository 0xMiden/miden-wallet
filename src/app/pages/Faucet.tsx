import React, { FC, useCallback, useEffect, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import { Button } from 'components/Button';
import { Message } from 'components/Message';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { getFaucetUrl } from 'lib/miden-chain/faucet';
import { useAccount, useNetwork } from 'lib/miden/front';
import { openFaucetWebview } from 'lib/mobile/faucet-webview';
import { isMobile } from 'lib/platform';
import { goBack } from 'lib/woozie';

async function copyTextToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    // Clipboard API not available, you may want to fallback to a more traditional method
    console.error('Clipboard API not available');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy text to clipboard', err);
  }
}

const Faucet: FC = () => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const account = useAccount();
  const address = account.publicKey;
  const { trackEvent } = useAnalytics();
  const network = useNetwork();

  const openFaucet = useCallback(async () => {
    copyTextToClipboard(address);
    trackEvent('Faucet/AddressCopied', AnalyticsEventCategory.ButtonPress);
    setCopied(true);
    const faucetUrl = getFaucetUrl(network.id);
    await openFaucetWebview({ url: faucetUrl, title: t('midenFaucet') });
  }, [address, trackEvent, network.id, t]);

  // On mobile, open the faucet webview immediately and go back when closed
  useEffect(() => {
    if (isMobile()) {
      openFaucet().then(() => goBack());
    }
  }, [openFaucet]);

  // On mobile, show nothing while the webview is open
  if (isMobile()) {
    return null;
  }

  return (
    <PageLayout pageTitle={<span>{t('faucet')}</span>}>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center bg-white p-4 md:w-[460px] md:mx-auto">
          <Message
            className="flex-1"
            title={t('midenFaucet')}
            description={t('midenFaucetDescription')}
            icon={IconName.Tokens}
            iconSize="3xl"
            iconClassName="mb-8"
          />
        </div>
        <div className="p-4 flex flex-col gap-y-4">
          <Button onClick={openFaucet}>
            <span className="text-base font-medium text-white">{copied ? t('copiedAddress') : t('goToFaucet')}</span>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Faucet;
