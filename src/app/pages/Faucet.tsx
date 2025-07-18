import React, { FC, useCallback, useState } from 'react';

import classNames from 'clsx';

import { useAppEnv } from 'app/env';
import { IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import { Button, ButtonVariant } from 'components/Button';
import { Message } from 'components/Message';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { T } from 'lib/i18n/react';
import { useAccount } from 'lib/miden/front';

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
  const [copied, setCopied] = useState(false);
  const account = useAccount();
  const address = account.publicKey;
  const { trackEvent } = useAnalytics();

  const onFaucetClick = useCallback(() => {
    copyTextToClipboard(address);
    trackEvent('Faucet/AddressCopied', AnalyticsEventCategory.ButtonPress);
    setCopied(true);
    window.open('https://faucet.testnet.miden.io', '_blank');
  }, [address, trackEvent]);

  return (
    <PageLayout
      pageTitle={
        <>
          <T id="faucet" />
        </>
      }
    >
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col justify-center bg-white p-4 md:w-[460px] md:mx-auto">
          <Message
            className="flex-1"
            title="Miden Faucet"
            description="Clicking the button below will copy your address to the clipboard and navigate you to the Miden Faucet."
            icon={IconName.FaucetFill}
            iconBackgroundClassName="bg-gradient-to-b from-gray-25 to-white rounded-full"
          />
        </div>
        <div className="p-4 flex flex-col gap-y-4">
          <Button onClick={onFaucetClick}>
            <span className="text-base font-medium text-white">
              {copied ? (
                <T id="copiedAddress" />
              ) : (
                <>
                  <T id="faucet" />
                </>
              )}
            </span>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Faucet;
