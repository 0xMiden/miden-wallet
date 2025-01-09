/* eslint-disable no-restricted-globals */

import React, { FC, Fragment, Suspense, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import ErrorBoundary from 'app/ErrorBoundary';
import ContentContainer from 'app/layouts/ContentContainer';
import Unlock from 'app/pages/Unlock';
import { useAccount, useMidenContext } from 'lib/miden/front';
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
import { MidenDAppPayload } from 'lib/miden/types';
import { DecryptPermission } from '@demox-labs/miden-wallet-adapter-base';

const ConfirmPage: FC = () => {
  const { ready } = useMidenContext();

  return useMemo(
    () =>
      ready ? (
        <ContentContainer
          padding={false}
          className={classNames('min-h-screen', 'flex flex-col items-center justify-center')}
        >
          <ErrorBoundary whileMessage={t('fetchingConfirmationDetails')}>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-screen">
                  <div>
                    <Spinner />
                  </div>
                </div>
              }
            >
              <ConfirmDAppForm />
            </Suspense>
          </ErrorBoundary>
        </ContentContainer>
      ) : (
        <Unlock canImportNew={false} />
      ),
    [ready]
  );
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
  payload: MidenDAppPayload;
  viewKey?: string;
  error?: any;
}

const PayloadContent: React.FC<PayloadContentProps> = ({ viewKey, error }) => {
  let content: string | React.ReactNode = t('noPreview');

  return (
    <div className={classNames('w-full', 'flex flex-col')}>
      {t(`Payload`) && (
        <h2 className={classNames('mb-2', 'leading-tight', 'flex flex-col')}>
          <T id={`Payload`}>
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
  } = useMidenContext();
  const account = useAccount();

  const loc = useLocation();
  const id = useMemo(() => {
    const usp = new URLSearchParams(loc.search);
    const pageId = usp.get('id');
    if (!pageId) {
      throw new Error(t('notIdentified'));
    }
    return pageId;
  }, [loc.search]);

  const { data } = useRetryableSWR<MidenDAppPayload>([id], getDAppPayload, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const payload = data!;
  const payloadError = data!.error;
  let requireDecryptCheckbox = false;
  let decryptPermission = DecryptPermission.NoDecrypt;
  if (payload.type === 'connect') {
    decryptPermission = payload.decryptPermission;
    if (payload.existingPermission) {
      confirmDAppPermission(id, true, account.publicKey, decryptPermission);
    }
  }
  requireDecryptCheckbox = decryptPermission === DecryptPermission.OnChainHistory;
  const [isDecryptChecked, setDecryptChecked] = useState(false);
  const delegate = isDelegateProofEnabled();

  const onConfirm = useCallback(
    async (confirmed: boolean) => {
      switch (payload.type) {
        case 'connect':
          return confirmDAppPermission(id, confirmed, account.publicKey, decryptPermission);
        case 'transaction':
          !delegate && openLoadingFullPage();
          return confirmDAppTransaction(id, confirmed, delegate);
      }
    },
    [id, payload.type, confirmDAppPermission, account.publicKey, decryptPermission, confirmDAppTransaction, delegate]
  );

  const [error, setError] = useSafeState<any>(null);
  const [confirming, setConfirming] = useSafeState(false);
  const [declining, setDeclining] = useSafeState(false);

  const confirm = useCallback(
    async (confirmed: boolean) => {
      setError(null);
      try {
        if (confirmed && requireDecryptCheckbox && !isDecryptChecked) {
          throw new Error(t('confirmError'));
        }
        await onConfirm(confirmed);
      } catch (err: any) {
        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError(err);
      }
    },
    [onConfirm, setError, isDecryptChecked, requireDecryptCheckbox]
  );

  const handleConfirmClick = useCallback(async () => {
    if (confirming || declining) return;

    setConfirming(true);
    await confirm(true);
    setConfirming(false);
  }, [confirming, declining, setConfirming, confirm]);

  const handleDeclineClick = useCallback(async () => {
    if (confirming || declining) return;

    setDeclining(true);
    await confirm(false);
    setDeclining(false);
  }, [confirming, declining, setDeclining, confirm]);

  const handleErrorAlertClose = useCallback(() => setError(null), [setError]);

  const content = useMemo(() => {
    switch (payload.type) {
      case 'connect':
        return {
          title: t('confirmAction', t('connection').toLowerCase()),
          declineActionTitle: t('cancel'),
          declineActionTestID: ConfirmPageSelectors.ConnectAction_CancelButton,
          confirmActionTitle: error ? t('retry') : t('connect'),
          confirmActionTestID: error
            ? ConfirmPageSelectors.ConnectAction_RetryButton
            : ConfirmPageSelectors.ConnectAction_ConnectButton,
          want: (
            <T
              id="appWouldLikeToConnectToYourWallet"
              substitutions={[
                <Fragment key="appName">
                  <span className="font-medium" style={{ fontSize: '14px', lineHeight: '20px' }}>
                    {payload.origin}
                  </span>
                  <br />
                </Fragment>
              ]}
            >
              {message => (
                <p className="mb-2 text-left text-black" style={{ fontSize: '12px', lineHeight: '16px' }}>
                  {message}
                </p>
              )}
            </T>
          )
        };
      case 'transaction':
        return {
          title: t('confirmAction', t('transactionAction').toLowerCase()),
          declineActionTitle: t('reject'),
          declineActionTestID: ConfirmPageSelectors.TransactionAction_RejectButton,
          confirmActionTitle: t('confirm'),
          confirmActionTestID: ConfirmPageSelectors.TransactionAction_AcceptButton,
          want: (
            <div className={classNames('text-sm text-left text-black', 'flex flex-col items-center')}>
              <div className="flex items-center justify-center">
                <DAppLogo icon={payload.appMeta.icon} origin={payload.origin} size={16} className="mr-1" />
                <Name className="font-semibold" style={{ maxWidth: '10rem' }}>
                  {payload.appMeta.name}
                </Name>
              </div>
              <T
                id="appRequestsTransaction"
                substitutions={[
                  <Name className="max-w-full text-xs italic" key="origin">
                    {payload.origin}
                  </Name>
                ]}
              />
            </div>
          )
        };
    }
  }, [error, payload]);

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
          <SubTitle small className={payload.type === 'connect' ? 'mt-4 mb-6' : 'mt-4 mb-2'}>
            {content.title}
          </SubTitle>

          {payload.type === 'connect' && (
            <ConnectBanner type={payload.type} origin={payload.origin} appMeta={payload.appMeta} className="mb-8" />
          )}

          {content.want}

          {payload.type === 'connect' && (
            <T id="viewAccountAddressWarning">
              {message => <p className="mb-4 text-xs  text-left text-black">{message}</p>}
            </T>
          )}

          {payload.type === 'connect' && (
            <DecryptPermissionBanner decryptPermission={decryptPermission} programs={payload.programs} />
          )}

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
              {payload.type !== 'connect' && account && (
                <AccountBanner
                  account={account}
                  networkRpc={payload.networkRpc}
                  labelIndent="sm"
                  className="w-full my-2"
                />
              )}

              <NetworkBanner rpc={payload.networkRpc} narrow={payload.type === 'connect'} />
              {payload.type !== 'connect' && <PayloadContent payload={payload} error={payloadError} />}
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
