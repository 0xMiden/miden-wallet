import React, { FC } from 'react';

import classNames from 'clsx';
import { QRCode } from 'react-qr-svg';

import FormField from 'app/atoms/FormField';
import PageLayout from 'app/layouts/PageLayout';
import { useAccount } from 'lib/miden/front';
import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

const Receive: FC = () => {
  const account = useAccount();
  const address = account.publicKey;
  const { fieldRef, copy, copied } = useCopyToClipboard();
  const { trackEvent } = useAnalytics();

  const onClick = () => {
    trackEvent('Receive/AddressCopied', AnalyticsEventCategory.ButtonPress);
    copy();
  };

  return (
    <PageLayout
      pageTitle={
        <>
          <T id="receive" />
        </>
      }
    >
      <div className="p-4">
        <div className={classNames('w-full max-w-sm mx-auto')}>
          <FormField
            textarea
            rows={2}
            ref={fieldRef}
            id="receive-address"
            label={
              <div className="font-medium mt-8" style={{ fontSize: '14px', lineHeight: '20px' }}>
                {t('address')}
              </div>
            }
            labelDescription={
              <div className="mt-2" style={{ fontSize: '12px', lineHeight: '16px' }}>
                {t('accountAddressLabel')}
              </div>
            }
            value={address}
            size={36}
            spellCheck={false}
            readOnly
            className="text-sm rounded mt-2"
            onClick={copy}
            style={{
              resize: 'none',
              lineHeight: '20px'
            }}
          />
          <div className="flex">
            <button
              type="button"
              className={classNames(
                'w-full mt-2 mb-6',
                'py-4 px-2 w-40',
                'hover:bg-gray-700',
                'active:bg-gray-600',
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
          <div className="flex flex-col items-center" style={{ padding: '36px 56px' }}>
            <div className="p-2 bg-white rounded-lg" style={{ maxWidth: '84%' }}>
              <QRCode bgColor="#FFF" fgColor="#634CFF" level="Q" style={{ width: '100%' }} value={address} />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Receive;
