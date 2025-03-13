import React, { FC, useState } from 'react';

import classNames from 'clsx';

import { useAppEnv } from 'app/env';
import { ReactComponent as ArrowIcon } from 'app/icons/arrow-right-top-alt.svg';
import { ReactComponent as InfoIcon } from 'app/icons/info-alert.svg';
import PageLayout from 'app/layouts/PageLayout';
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
  const { fullPage } = useAppEnv();
  const { trackEvent } = useAnalytics();

  // const itemWidth = fullPage ? 'w-1/2' : 'w-full';

  const onClick = () => {
    copyTextToClipboard(address);
    trackEvent('Faucet/AddressCopied', AnalyticsEventCategory.ButtonPress);
    setCopied(true);
  };

  return (
    <PageLayout
      pageTitle={
        <>
          <T id="faucet" />
        </>
      }
    >
      <div className="flex flex-col items-center">
        <div className="flex flex-col max-w-sm">
          <div className={classNames('flex flex-col')}>
            <div key={0} className={`flex flex-col ${fullPage ? 'mt-8' : ''}`}>
              <div className="flex">
                <div
                  className="text-sm h-6 rounded-full text-white text-center"
                  style={{ backgroundColor: '#634CFF', lineHeight: '24px', height: '24px', width: '24px' }}
                >
                  {1}
                </div>
                <div className="flex flex-col ml-2">
                  <div className="text-sm mb-1">
                    Join the{' '}
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3872D4' }}
                      href="https://link.leo.app/faucet-discord"
                    >
                      Leo Wallet Discord
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div key={1} className="flex flex-col mt-4">
              <div className="flex">
                <div
                  className="text-sm h-6 rounded-full text-white text-center"
                  style={{ backgroundColor: '#634CFF', lineHeight: '24px', height: '24px', width: '24px' }}
                >
                  {2}
                </div>
                <div className="flex flex-col ml-2">
                  <div className="text-sm mb-1">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3872D4' }}
                      href="https://link.leo.app/faucet-verify"
                    >
                      Verify
                    </a>
                    {' your account on the server'}
                  </div>
                </div>
              </div>
            </div>
            <div key={3} className="flex flex-col mt-4">
              <div className="flex">
                <div
                  className="text-sm h-6 rounded-full text-white text-center"
                  style={{ backgroundColor: '#634CFF', lineHeight: '24px', height: '24px', width: '24px' }}
                >
                  {3}
                </div>
                <div className="flex flex-col ml-2">
                  <div className="text-sm mb-1">
                    Navigate to{' '}
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3872D4' }}
                      href="https://link.leo.app/faucet-channel"
                    >
                      the faucet channel
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div key={4} className="flex flex-col mt-4">
              <div className="flex">
                <div
                  className="text-sm h-6 rounded-full text-white text-center"
                  style={{ backgroundColor: '#634CFF', lineHeight: '24px', height: '24px', width: '24px' }}
                >
                  {4}
                </div>
                <div className="flex flex-col w-5/6 ml-2">
                  <div className="text-sm mb-1">Press the 'Request Faucet' button and paste your address.</div>
                </div>
              </div>
            </div>
            <div key={5} className="flex flex-col mt-4">
              <div className="flex">
                <div
                  className="text-sm h-6 rounded-full text-white text-center"
                  style={{ backgroundColor: '#634CFF', lineHeight: '24px', height: '24px', width: '24px' }}
                >
                  {5}
                </div>
                <div className="flex flex-col w-5/6 ml-2">
                  <div className="text-sm mb-1">Done! 15 Testnet credits will be delivered in a few minutes.</div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center my-8">
            <div className="text-center font-medium mr-2" style={{ fontSize: '16px', lineHeight: '24px' }}>
              <a target="_blank" rel="noopener noreferrer" href="https://link.leo.app/faucet-tutorial">
                Tutorial
              </a>
            </div>
            <div style={{ lineHeight: '24px', paddingTop: '6px' }}>
              <ArrowIcon height={12} width={12} />
            </div>
          </div>
          <div
            className={`flex text-center rounded-lg max-w-sm `}
            style={{ fontSize: '14px', lineHeight: '20px', backgroundColor: '#ECF5FF', padding: '12px 28px' }}
          >
            <div>
              <span>
                <InfoIcon stroke={'none'} style={{ height: '16px', width: '16px', marginTop: '2px' }} />
              </span>
            </div>
            <div className="flex flex-col px-2 text-left">
              <span className="font-medium" style={{ fontSize: '14px', lineHeight: '20px', marginBottom: '4px' }}>
                Faucet Q&A
                <br />
              </span>
              <span className="text-xs">
                If you have any questions about the faucet, please create a support ticket in the Leo Wallet Discord
                server.
              </span>
            </div>
          </div>

          <button
            type="button"
            className={classNames(
              `mt-2 flex-1`,
              'py-4 px-2',
              'hover:bg-gray-700',
              'active:bg-gray-100',
              'flex items-center justify-center',
              'text-black bg-gray-800 rounded-lg',
              'font-semibold',
              'transition duration-300 ease-in-out',
              'opacity-90 hover:opacity-100 focus:opacity-100',
              'shadow-sm',
              'hover:shadow focus:shadow'
            )}
            style={{ fontSize: '16px', lineHeight: '24px' }}
            onClick={onClick}
          >
            {copied ? (
              <T id="copiedAddress" />
            ) : (
              <>
                <T id="copyAddressToClipboard" />
              </>
            )}
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Faucet;
