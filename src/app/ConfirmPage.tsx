/* eslint-disable no-restricted-globals */

import React, { FC, Fragment, Suspense, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import ErrorBoundary from 'app/ErrorBoundary';
import ContentContainer from 'app/layouts/ContentContainer';
import Unlock from 'app/pages/Unlock';
import { useMidenClient } from 'lib/miden/front';
import { CustomRpsContext } from 'lib/analytics';
import { ALEO_DECIMALS } from 'lib/fiat-curency';
import { formatBigInt } from 'lib/i18n/numbers';
import { T, t } from 'lib/i18n/react';
import { useRetryableSWR } from 'lib/swr';
import useSafeState from 'lib/ui/useSafeState';
import { useLocation } from 'lib/woozie';

import Alert from './atoms/Alert';
import FormSecondaryButton from './atoms/FormSecondaryButton';
import FormSubmitButton from './atoms/FormSubmitButton';
import Name from './atoms/Name';
import SubTitle from './atoms/SubTitle';
import { ConfirmPageSelectors } from './ConfirmPage.selectors';
import { openLoadingFullPage } from './env';
import AccountBanner from './templates/AccountBanner';
import ConnectBanner from './templates/ConnectBanner';
import DAppLogo from './templates/DAppLogo';
import DecryptPermissionBanner from './templates/DecryptPermissionBanner';
import DecryptPermissionCheckbox from './templates/DecryptPermissionCheckbox';
import { isDelegateProofEnabled } from './templates/DelegateSettings';
import NetworkBanner from './templates/NetworkBanner';

const ConfirmPage: FC = () => {
  return <Unlock canImportNew={false} />;
};

function downloadData(filename: string, data: string) {
  const blob = new Blob([data], { type: 'application/json' });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
}

interface PayloadContentProps {
  viewKey?: string;
  error?: any;
}

const PayloadContent: React.FC<PayloadContentProps> = ({ viewKey, error }) => {
  let content: string | React.ReactNode = t('noPreview');

  return (
    <div className={classNames('w-full', 'flex flex-col')}>
      {t(`Payload`) && (
        <h2 className={classNames('mb-2', 'leading-tight', 'flex flex-col')}>
          <T id={`$Payload`}>
            {message => (
              <span className="text-black font-medium" style={{ fontSize: '14px', lineHeight: '20px' }}>
                {message}
              </span>
            )}
          </T>
        </h2>
      )}
      <span className="text-sm text-black break-all" style={{ whiteSpace: 'pre-line' }}>
        {!!error ? error : content}
      </span>
    </div>
  );
};

export default ConfirmPage;

const ConfirmDAppForm: FC = () => {
  const {
    getDAppPayload,
    confirmDAppPermission,
    confirmDAppSign,
    confirmDAppDecrypt,
    confirmDAppRecords,
    confirmDAppTransaction,
    confirmDAppBulkTransactions,
    confirmDAppDeploy
  } = useMidenClient();

  const loc = useLocation();
  const id = useMemo(() => {
    const usp = new URLSearchParams(loc.search);
    const pageId = usp.get('id');
    if (!pageId) {
      throw new Error(t('notIdentified'));
    }
    return pageId;
  }, [loc.search]);

  let requireDecryptCheckbox = false;
  const [isDecryptChecked, setDecryptChecked] = useState(false);
  const delegate = isDelegateProofEnabled();

  const [error, setError] = useSafeState<any>(null);
  const [confirming, setConfirming] = useSafeState(false);
  const [declining, setDeclining] = useSafeState(false);

  const handleConfirmClick = useCallback(async () => {
    if (confirming || declining) return;

    setConfirming(true);
    setConfirming(false);
  }, [confirming, declining, setConfirming, confirm]);

  const handleDeclineClick = useCallback(async () => {
    if (confirming || declining) return;

    setDeclining(true);
    setDeclining(false);
  }, [confirming, declining, setDeclining, confirm]);

  const handleErrorAlertClose = useCallback(() => setError(null), [setError]);

  return (
    <CustomRpsContext.Provider value={'TODO'}>
      <div
        className={classNames('relative bg-white rounded-md shadow-md overflow-y-auto', 'flex flex-col')}
        style={{
          width: 380,
          height: 610
        }}
      >
        <div className="flex flex-col items-left px-4 py-2">
          <SubTitle small className={'connect' === 'connect' ? 'mt-4 mb-6' : 'mt-4 mb-2'}>
            {'TODO Title Confirm Page'}
          </SubTitle>

          {'connect' === 'connect' && <ConnectBanner type={'connect'} origin={'origin'} className="mb-8" />}

          {'connect' === 'connect' && (
            <T id="viewAccountAddressWarning">
              {message => <p className="mb-4 text-xs  text-left text-black">{message}</p>}
            </T>
          )}

          {'connect' === 'connect' && <DecryptPermissionBanner programs={[]} />}

          {requireDecryptCheckbox && <DecryptPermissionCheckbox setChecked={setDecryptChecked} />}

          {error ? (
            <Alert
              closable
              onClose={handleErrorAlertClose}
              type="error"
              title="Error"
              description={error?.message ?? t('smthWentWrong')}
              className="my-4"
              autoFocus
            />
          ) : (
            <>
              {'connect' !== 'connect' && (
                <AccountBanner networkRpc={'networkRpc'} labelIndent="sm" className="w-full my-2" />
              )}

              <NetworkBanner rpc={'payload.networkRpc'} narrow={'connect' === 'connect'} />
              {'connect' !== 'connect' && <PayloadContent viewKey={'viewKey'} />}
            </>
          )}
        </div>

        <div className="flex-1" />

        <div
          className={classNames('sticky bottom-0 w-full', 'bg-white shadow-md', 'flex items-stretch', 'px-4 pt-2 pb-8')}
        >
          <div className="w-1/2 pr-2">
            <FormSecondaryButton
              type="button"
              className={classNames(
                'w-full justify-center',
                'px-8',
                'rounded-lg',
                'bg-gray-800',
                'hover:bg-gray-700',
                'active:bg-gray-600',
                'flex items-center',
                'text-black',
                'font-semibold',
                'transition duration-200 ease-in-out'
              )}
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                padding: '14px 0px',
                border: 'none'
              }}
              loading={declining}
              onClick={handleDeclineClick}
            >
              {'content.declineActionTitle'}
            </FormSecondaryButton>
          </div>

          <div className="w-1/2 pl-2">
            <FormSubmitButton
              type="button"
              className="w-full justify-center justify-center rounded-lg py-3"
              style={{ fontSize: '16px', lineHeight: '24px', padding: '14px 0px', border: 'none' }}
              loading={confirming}
              onClick={handleConfirmClick}
              testID={'content.confirmActionTestID'}
            >
              {'content.confirmActionTitle'}
            </FormSubmitButton>
          </div>
        </div>
      </div>
    </CustomRpsContext.Provider>
  );
};
