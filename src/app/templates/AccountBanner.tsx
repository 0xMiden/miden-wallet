import React, { HTMLAttributes, memo, ReactNode } from 'react';

import classNames from 'clsx';

import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import ColorIdenticon from 'app/atoms/ColorIdenticon';
import Name from 'app/atoms/Name';

import { t } from 'lib/i18n/react';
import { WalletAccount } from 'lib/shared/types';

type AccountBannerProps = HTMLAttributes<HTMLDivElement> & {
  account?: WalletAccount;
  displayBalance?: boolean;
  networkRpc?: string;
  label?: ReactNode;
  labelDescription?: ReactNode;
  labelIndent?: 'sm' | 'md';
};

const AccountBanner = memo<AccountBannerProps>(({ className, label, labelIndent = 'md', labelDescription }) => {
  const labelWithFallback = label ?? t('account');

  return (
    <div className={classNames('flex flex-col mt-4', className)}>
      {(labelWithFallback || labelDescription) && (
        <h2 className={classNames(labelIndent === 'md' ? 'mb-4' : 'mb-2', 'leading-tight', 'flex flex-col')}>
          {labelWithFallback && (
            <span className="text-black font-medium" style={{ fontSize: '14px', lineHeight: '20px' }}>
              {labelWithFallback}
            </span>
          )}

          {labelDescription && (
            <span
              className={classNames('mt-2', 'text-xs  text-black')}
              style={{ maxWidth: '90%', fontSize: '12px', lineHeight: '16px' }}
            >
              {labelDescription}
            </span>
          )}
        </h2>
      )}

      <div className={classNames('w-full', 'border border-gray-600 rounded-lg', 'px-4 py-5', 'flex items-center')}>
        <ColorIdenticon publicKey={'1234'} size={20} className="flex-shrink-0 shadow-xs" />

        <div className="flex flex-col items-start ml-3">
          <div className="flex flex-wrap items-center">
            <Name className="leading-tight text-black" style={{ fontSize: '14px', lineHeight: '20px' }}>
              {'account name'}
            </Name>

            <AccountTypeBadge />
          </div>

          <div className="flex flex-wrap items-center mt-1">
            <div className={classNames('text-xs leading-none', 'text-gray-200')}>
              {(() => {
                const val = '123456789101112';
                const ln = val.length;
                return (
                  <>
                    {val.slice(0, 7)}
                    <span className="opacity-75">...</span>
                    {val.slice(ln - 4, ln)}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AccountBanner;
